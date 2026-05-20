# Smart Spend

Smart Spend is a Flask expense-tracking web app for recording daily transactions, viewing monthly and historical spending, and generating Plotly charts for category, month-wise, and yearly comparisons.

## Features

- User registration and login
- Password reset through email
- Add, edit, and delete expense transactions
- Current-month expense summary
- Transaction history filtered by month and year
- Category pie chart, monthly bar chart, and yearly comparison chart

## Project Structure

```text
.
├── app.py                  # Flask application and routes
├── config.py               # Flask/email configuration from environment variables
├── database/
│   └── schema.sql          # MySQL database schema
├── db.example.yaml         # Example local database config
├── legacy/
│   └── prototype/          # Older prototype files kept for reference
├── static/                 # CSS, JavaScript, and image assets
├── templates/              # Jinja templates
└── requirements.txt        # Python dependencies
```

## Local Setup

1. Create and activate a virtual environment.
2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Create a local database config:

   ```bash
   cp db.example.yaml db.yaml
   ```

4. Create the MySQL schema from `database/schema.sql`.
5. Set environment variables from `.env.example`, especially `SECRET_KEY`, `EMAIL_USER`, and `EMAIL_PASS`.
6. Run the app:

   ```bash
   flask --app app run --debug
   ```

## Notes

- `db.yaml` is intentionally ignored because it contains local database credentials.
- The `legacy/prototype` folder contains an older version of the application and is not part of the main runtime path.
