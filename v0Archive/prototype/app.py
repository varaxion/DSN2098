# Modules & libraries
from flask import Flask, render_template, request, redirect, flash, session

import yaml
import pymysql

# Start App
app = Flask(__name__)
app.secret_key = 'dsn2098'


# Configure MySQL Connection
ydb=yaml.load(open('db.yaml'), Loader=yaml.SafeLoader)

db = pymysql.connect(
    host = ydb['mysql_host'],
    user = ydb['mysql_user'],
    password = ydb['mysql_password'],
    database = ydb['mysql_db'] 
    )

# Home Page
@app.route('/home') 
def home():
    return render_template('home.html') 


# Login Page
@app.route('/login', methods=['POST','GET'])    
def login():
    if request.method == 'POST': 
        UN = request.form['USERNAME']
        PW = request.form['PASSWORD']

        cur = db.cursor()   
        login_query = """SELECT USERNAME , PASSWORD 
                         FROM USERS 
                         WHERE USERNAME = '{un}' AND PASSWORD = '{pw}'""".format(un=UN, pw=PW)
        cur.execute(login_query)
        user = cur.fetchall()       
        
        if len(user) == 1:
            #return("Login Successful")
            flash("Login Successful")
            return redirect('/menu')
        
        else:
            check_query = """SELECT USERNAME 
                             FROM USERS 
                             WHERE USERNAME = '{un}'""".format(un=UN)
            cur.execute(check_query)
            r = cur.fetchall()
            cur.close()
            if len(r) == 1:
                return "Incorrect Password"
            else:    
                return redirect("/register")
    
    return render_template('login.html')      

# Register
@app.route('/register', methods=['GET','POST'])
def register():
    if request.method == 'POST':
        NUN = request.form['NUSERNAME']
        NPW = request.form['NPASSWORD']
        
        cur = db.cursor()
        check_query = """SELECT USERNAME 
                         FROM USERS 
                         WHERE USERNAME = '{un}'""".format(un=NUN)
        cur.execute(check_query)
        r = cur.fetchall()
        if len(r) == 1:
            return "Username already exists, Try a different one!"
        else:
            register_query = """INSERT INTO USERS(USERNAME,PASSWORD) 
                            VALUES('{un}','{pw}')""".format(un=NUN, pw=NPW)
            try:
                cur.execute(register_query) 
                db.commit()
                return redirect("/login")        
            except:
                if len(NUN) > 20:
                    db.rollback()
                if len(NPW) > 20:
                    db.rollback()
        cur.close()
        db.close()
    return render_template('register.html') 

@app.route('/menu', methods=['GET','POST'])
def menu():
    return render_template('menu.html')


@app.route('/add_expenses', methods=['GET','POST'])
def add_expenses():
    if request.method == 'POST':
        # Get data from form
        amount = request.form.get('amount')
        date = request.form.get('date')
        category = request.form.get('category')
        
        # Insert data into MySQL table
        cur = db.cursor()
        
        entry_query = """INSERT INTO EXPENSES2 (AMOUNT, DATE, CATEGORY) 
                      VALUES (%s, %s, %s);"""
        cur.execute(entry_query, (amount, date, category))
        db.commit()
        cur.close()

        return redirect('/add_expenses')
    return render_template('add_expenses.html')


@app.route('/disp_expend', methods=['GET','POST'])
def disp_expend():
    return render_template('disp_expend.html')


# Run App
if __name__ == "__main__":
    app.run(debug=True)

