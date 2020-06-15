import os
from dotenv import load_dotenv



basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))


class Config:

    # DROPBOX configuration:
    DROPBOX_KEY = os.environ.get('DROPBOX_KEY')
    LOGS_DROPBOX_PATH = '/Sent files/Pomodoro/logs.csv'

    # Local paths:
    PICKLE_LOCAL_PATH = os.path.join(basedir, 'test.pickle')
    LOGS_LOCAL_PATH = os.path.join(basedir, '../logs.csv')
    LOGS_MONTH_PATH = os.path.join(basedir, '../logs_this_month.csv')
    SETTING_JSON_PATH = os.path.join(basedir, '../settings.json')

    # Pomodoro:
    RE_PROJECT = r'\+.*?[^\s]*'
    RE_CONTEXT = r'@.*?[^\s]*'
    RE_TASK = r'(?<=\s)\w[^\s]*'

    # Server
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'blablabla'
