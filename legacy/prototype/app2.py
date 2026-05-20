from flask import Flask, render_template, request, redirect, flash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import yaml
import pymysql

# Start App
app = Flask(__name__)
app.secret_key = 'dsn2098'

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Configure MySQL Connection
ydb=yaml.load(open('db.yaml'), Loader=yaml.SafeLoader)
db = pymysql.connect(
    host = ydb['mysql_host'],
    user = ydb['mysql_user'],
    password = ydb['mysql_password'],
    database = ydb['mysql_db']
)

class User(UserMixin):
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password

@login_manager.user_loader
def load_user(user_id):
    cur = db.cursor()
    cur.execute("SELECT ID, USERNAME, PASSWORD FROM USERS WHERE ID = %s", (user_id,))
    result = cur.fetchone()
    cur.close()
    if result:
        return User(id=result[0], username=result[1], password=result[2])
    return None

@app.route('/login', methods=['POST','GET'])    
def login():
    if request.method == 'POST': 
        UN = request.form['USERNAME']
        PW = request.form['PASSWORD']
        cur = db.cursor()
        cur.execute("SELECT ID, USERNAME, PASSWORD FROM USERS WHERE USERNAME = %s AND PASSWORD = %s", (UN, PW))
        user = cur.fetchone()
        cur.close()

        if user:
            user_obj = User(id=user[0], username=user[1], password=user[2])
            login_user(user_obj)
            flash("Login Successful")
            return redirect('/menu')
        else:
            flash("Invalid username or password.")
            return redirect('/login')
    
    return render_template('login.html')      

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect('/home')

@app.route('/register', methods=['GET','POST'])
def register():
    if request.method == 'POST':
        NUN = request.form['NUSERNAME']
        NPW = request.form['NPASSWORD']
        
        cur = db.cursor()
        cur.execute("SELECT USERNAME FROM USERS WHERE USERNAME = %s", (NUN,))
        user = cur.fetchone()

        if user:
            flash("Username already exists, Try a different one!")
            return redirect('/register')
        else:
            try:
                cur.execute("INSERT INTO USERS(USERNAME,PASSWORD) VALUES(%s,%s)", (NUN, NPW))
                db.commit()
                return redirect("/login")        
            except:
                db.rollback()
        cur.close()

    return render_template('register.html')

@app.route('/menu', methods=['GET','POST'])
@login_required
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

