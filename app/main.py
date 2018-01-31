from flask import Flask
app = Flask(__name__)

@app.route('/')
def hi():
    return 'hi peter'
