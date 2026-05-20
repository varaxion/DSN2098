from flask import Flask, request, jsonify, session
from flask_cors import CORS
from passlib.hash import sha256_crypt
from functools import wraps
import datetime
from authlib.jose import jwt
from flask_mail import Mail, Message
import pymysql
import yaml
import os

# Configure MySQL Connection
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_CONFIG_PATH = os.environ.get(
    'SMART_SPEND_DB_CONFIG',
    os.path.join(BASE_DIR, 'db.yaml')
)

with open(DB_CONFIG_PATH, 'r') as db_config:
    ydb = yaml.load(db_config, Loader=yaml.SafeLoader)

db = pymysql.connect(
    host = ydb['mysql_host'],
    user = ydb['mysql_user'],
    password = ydb['mysql_password'],
    database = ydb['mysql_db'],
    cursorclass=pymysql.cursors.DictCursor
)

class JWTSerializer:
    def __init__(self, secret_key):
        self.secret_key = secret_key

    def dumps(self, payload, expires_in=1800):
        header = {'alg': 'HS256'}
        payload['exp'] = datetime.datetime.utcnow() + datetime.timedelta(seconds=expires_in)
        return jwt.encode(header, payload, self.secret_key)

    def loads(self, token):
        try:
            claims = jwt.decode(token, self.secret_key)
            return claims
        except (jwt.ExpiredTokenError, jwt.DecodeError, jwt.InvalidTokenError) as e:
            raise e

app = Flask(__name__)
# Enable CORS for the frontend origin
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])
app.config.from_pyfile('config.py')

mail = Mail(app)

def is_logged_in(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            return f(*args, **kwargs)
        else:
            return jsonify({"error": "Unauthorized"}), 401
    return wrap

@app.route('/api/auth/status', methods=['GET'])
def auth_status():
    if 'logged_in' in session and session['logged_in']:
        return jsonify({"loggedIn": True, "username": session.get('username')})
    return jsonify({"loggedIn": False})

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    email = data.get('email')
    username = data.get('username')
    password_input = data.get('password')
    
    if not all([first_name, last_name, email, username, password_input]):
        return jsonify({"error": "All fields are required"}), 400

    password = sha256_crypt.encrypt(str(password_input))

    cur = db.cursor()
    cur.execute("SELECT * FROM users WHERE email=%s", [email])
    if cur.rowcount > 0:
        cur.close()
        return jsonify({"error": "Email already exists"}), 409
    
    cur.execute("SELECT * FROM users WHERE username=%s", [username])
    if cur.rowcount > 0:
        cur.close()
        return jsonify({"error": "Username already exists"}), 409

    cur.execute("INSERT INTO users(first_name, last_name, email, username, password) VALUES(%s, %s, %s, %s, %s)",
                (first_name, last_name, email, username, password))
    db.commit()
    cur.close()
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password_input = data.get('password')

    cur = db.cursor()
    result = cur.execute("SELECT * FROM users WHERE username = %s", [username])

    if result > 0:
        user_data = cur.fetchone()
        user_id = user_data['id']
        password = user_data['password']
        role = user_data['role']

        if sha256_crypt.verify(password_input, password):
            session['logged_in'] = True
            session['username'] = username
            session['role'] = role
            session['userID'] = user_id
            cur.close()
            return jsonify({"message": "Login successful", "username": username}), 200
        else:
            cur.close()
            return jsonify({"error": "Invalid password"}), 401
    else:
        cur.close()
        return jsonify({"error": "Username not found"}), 404

@app.route('/api/auth/logout', methods=['POST'])
@is_logged_in
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/transactions', methods=['GET'])
@is_logged_in
def get_transactions():
    cur = db.cursor()
    cur.execute(
        "SELECT * FROM transactions WHERE user_id = %s ORDER BY date DESC", 
        [session['userID']]
    )
    transactions = cur.fetchall()
    
    # Calculate totals
    cur.execute(
        "SELECT SUM(amount) as total FROM transactions WHERE MONTH(date) = MONTH(CURRENT_DATE()) AND YEAR(date) = YEAR(CURRENT_DATE()) AND user_id = %s",
        [session['userID']]
    )
    total_month = cur.fetchone()['total'] or 0

    cur.execute(
        "SELECT SUM(amount) as total FROM transactions WHERE user_id = %s",
        [session['userID']]
    )
    total_overall = cur.fetchone()['total'] or 0

    # Format dates
    for t in transactions:
        t['date'] = t['date'].strftime('%Y-%m-%d')
        
    cur.close()
    return jsonify({
        "transactions": transactions,
        "totalMonth": float(total_month),
        "totalOverall": float(total_overall)
    }), 200

@app.route('/api/transactions', methods=['POST'])
@is_logged_in
def add_transaction():
    data = request.json
    amount = data.get('amount')
    description = data.get('description')
    category = data.get('category')
    
    if not all([amount, description, category]):
        return jsonify({"error": "Amount, description, and category are required"}), 400

    cur = db.cursor()
    cur.execute(
        "INSERT INTO transactions(user_id, amount, description, category) VALUES(%s, %s, %s, %s)", 
        (session['userID'], amount, description, category)
    )
    db.commit()
    cur.close()
    return jsonify({"message": "Transaction added successfully"}), 201

@app.route('/api/transactions/<string:id>', methods=['PUT', 'DELETE'])
@is_logged_in
def modify_transaction(id):
    cur = db.cursor()
    
    # Ensure it belongs to the user
    cur.execute("SELECT * FROM transactions WHERE id = %s AND user_id = %s", [id, session['userID']])
    if cur.rowcount == 0:
        cur.close()
        return jsonify({"error": "Transaction not found"}), 404
        
    if request.method == 'DELETE':
        cur.execute("DELETE FROM transactions WHERE id = %s", [id])
        db.commit()
        cur.close()
        return jsonify({"message": "Transaction deleted"}), 200
        
    elif request.method == 'PUT':
        data = request.json
        amount = data.get('amount')
        description = data.get('description')
        category = data.get('category')
        
        cur.execute("UPDATE transactions SET amount=%s, description=%s, category=%s WHERE id = %s",
                    (amount, description, category, id))
        db.commit()
        cur.close()
        return jsonify({"message": "Transaction updated"}), 200

@app.route('/api/stats/category', methods=['GET'])
@is_logged_in
def category_stats():
    cur = db.cursor()
    cur.execute(
        "SELECT Sum(amount) AS amount, category FROM transactions WHERE YEAR(date) = YEAR(CURRENT_DATE()) AND user_id = %s GROUP BY category ORDER BY category",
        [session['userID']]
    )
    stats = cur.fetchall()
    cur.close()
    
    for stat in stats:
        stat['amount'] = float(stat['amount'])
        
    return jsonify(stats), 200

@app.route('/api/stats/monthly', methods=['GET'])
@is_logged_in
def monthly_stats():
    cur = db.cursor()
    cur.execute(
        "SELECT sum(amount) as amount, month(date) as month FROM transactions WHERE YEAR(date) = YEAR(CURRENT_DATE()) AND user_id = %s GROUP BY MONTH(date) ORDER BY MONTH(date)",
        [session['userID']]
    )
    stats = cur.fetchall()
    cur.close()
    
    for stat in stats:
        stat['amount'] = float(stat['amount'])
        
    return jsonify(stats), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
