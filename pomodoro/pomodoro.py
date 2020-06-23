import os
import sys
import time
import re
import pandas as pd
import dropbox
import calendar
import requests
import pickle
import json
from datetime import datetime
from calendar import monthrange
from config import Config



class PomodoroTargetError(Exception):
    pass



class PomodoroTarget:
    """Specifies, provides details and measures task accomplishment in terms of
    time spended on it.

    Each `instance` has its counterpart in Pomodoro's project('+'),
    context('@') or task('').
    """
    all_targets = []

    def __init__(self, target_title, target_hrs, todos, free_days=8):
        """Contains info about target's specification.

        Target can contain both '+'(projects), '@'(contexts) and tasks.

        :param target_title: title of target that can contain few activities.

        :param target_hrs: number of hours to spend on `todos` activities.

        :param free_days: desired number of free days on the basis of which
        avg. of required hours per day is calculated.
        During month this number adapts dynamically depending on actual
        performance to meet target.

        :param todos: list of activities that sum up for the target:
            ['+project1', 'task1', '+project2', '@context1', '@context2', ...]
        """
        self.__year = datetime.today().year
        self.__month = datetime.today().month
        self.__days_in_month = monthrange(self.__year, self.__month)[1]

        self.title = target_title
        self.todos = todos
        self.target_hrs = float(target_hrs)
        self.free_days = float(free_days)
        self.per_day = self.target_hrs / (self.__days_in_month-self.free_days)

        self.__regex = self.extract_todos(todos)
        PomodoroTarget.all_targets.append(self)

    @property
    def title(self):
        return self.__title

    @title.setter
    def title(self, value):
        if value in [item.title for item in PomodoroTarget.all_targets]:
            raise PomodoroTargetError({
                'text': 'This title is already used',
                'type': 'danger'
            })
        self.__title = value

    @property
    def free_days(self):
        return self.__free_days

    @free_days.setter
    def free_days(self, value):
        """Can take value from range [0, 25]."""
        self.__free_days = 0 if value < 0 else min(value, 25)

    @property
    def per_day(self):
        return self.__per_day

    @per_day.setter
    def per_day(self, value):
        """Can take value from range (0, 20) or None - unachievable target."""
        if 0 < value < 20:
            self.__per_day = value
        elif self.free_days == 0:
            self.__per_day = None
        else:
            self.free_days = self.__days_in_month - (self.target_hrs/20)
            self.per_day = self.target_hrs / (self.__days_in_month-self.free_days)

    @property
    def progress(self):
        """Calculates total hours spent for target activities in its month."""
        _logs_file = Config.LOGS_LOCAL_PATH
        if not _logs_file.endswith('.csv'):
            raise TypeError('Wrong file. Choose CSV file')
        if not os.path.exists(_logs_file):
            raise PomodoroTargetError({
                'text': 'Data Not Found. Update file', 'type': 'danger'
            })

        df_pomodoros = pd.read_csv(_logs_file)
        df_pomodoros['custom_date'] = pd.to_datetime(df_pomodoros['custom_date'])
        df_this_month = df_pomodoros[
            (df_pomodoros.custom_date.dt.year == self.__year) &
            (df_pomodoros.custom_date.dt.month == self.__month)
        ]
        df_this_month = df_this_month[
            df_this_month['description'].str.contains(self.__regex)
        ]
        return df_this_month['hours'].sum()


    def refresh(self):
        """Updates Target performance according to progress and days left."""
        _progress = self.progress
        _hrs_left = max(0, self.target_hrs-_progress)
        _days_left = self.__days_in_month - datetime.today().day
        self.free_days = (
            0 if self.per_day is None
            else _days_left - (_hrs_left/self.per_day)
        )
        self.per_day = (
            self.per_day if not _hrs_left
            else _hrs_left / (_days_left-self.free_days)
        )
        return self


    def to_dict(self, _progress=None):
        target_dict = {
            'title': self.title,
            'targethrs': self.target_hrs,
            'freedays': self.free_days,
            'perday': self.per_day,
            'todos': self.todos,
            'progress': self.progress if _progress is None else _progress,
        }
        return target_dict


    @staticmethod
    def extract_todos(todos):
        """Create regex that filters Pomodoros of provided categories."""
        if not isinstance(todos, list):
            raise TypeError({
                'message': 'You need to provide list of activities as string',
                'type': 'danger',
            })
        if not todos:
            raise PomodoroTargetError({
                'text': 'Add categories to the Target',
                'type': 'danger'
            })
        todos = [
            rf'\+{item[1:]}[^\s]*' if item.startswith('+')
            else rf'@{item[1:]}[^\s]*' if item.startswith('@')
            else rf'(?<=\s){item}[^\s]*'
            for item in todos
        ]
        return r'|'.join(todos)


    @staticmethod
    def convert_to_hours(coloned_time):
        """Converts 'hh:mm:ss' or 'mm:ss' or 'ss' --> hours."""
        secs = sum(
            int(t) * (60**i)
            for i, t in enumerate(reversed(coloned_time.split(':')))
        )
        return secs / 3600


    @staticmethod
    def get_settings(key=None):
        """Get setting for given `key` from json file. By default returns all."""
        with open(Config.SETTING_JSON_PATH, 'rb') as f_json:
            cfg = json.load(f_json)
        return  cfg if key is None else cfg.get(key, None)


    @classmethod
    def update_data(cls):
        """Downloads Pomodoro's logs from Dropbox and adapts dataset."""
        dpx = dropbox.Dropbox(Config.DROPBOX_KEY)

        while True:
            try:
                dpx.files_download_to_file(
                    Config.LOGS_LOCAL_PATH, Config.LOGS_DROPBOX_PATH
                )
            except dropbox.exceptions.ApiError:
                raise PomodoroTargetError({
                    'text': 'Problem with API connections...',
                    'type': 'danger'
                })
            except requests.exceptions.ConnectionError:
                raise PomodoroTargetError({
                    'text': 'Cannot connect Dropbox. Check your internet connection',
                    'type': 'danger'
                })
            else:
                print('logs.csv downloaded correctly')
                break

        # Load data, Adjust header, Add full date and Convert duration format:
        header = ['year','month','day','time','duration','start','end','description']
        df_pomodoros = pd.read_csv(
            Config.LOGS_LOCAL_PATH, names=header, skiprows=1, na_filter=False,
            parse_dates={'pomodoro_datetime': ['year', 'month', 'day', 'time']},
            keep_date_col=True
        )
        try:
            hh, mm = cls.get_settings('day_start').split(':')
            hh, mm = int(hh), int(mm)
        except ValueError:
            hh, mm = 0, 0
        finally:
            df_pomodoros['custom_date'] = (
                df_pomodoros['pomodoro_datetime'] + pd.Timedelta(hours=-hh, minutes=-mm)
            ).dt.date

            df_pomodoros['hours'] = df_pomodoros['duration'].apply(cls.convert_to_hours)
            df_pomodoros.to_csv(Config.LOGS_LOCAL_PATH, index=False)

        return True


    @classmethod
    def save(cls, path=Config.PICKLE_LOCAL_PATH):
        """Saves list of all Targets."""
        with open(path, 'wb') as f:
            pickle.dump(cls.all_targets, f)


    @classmethod
    def load(cls, path=Config.PICKLE_LOCAL_PATH):
        """Loads list of all Targets."""
        if not os.path.exists(path):
            return []
        with open(path, 'rb') as f:
            targets = pickle.load(f)
        return targets



if __name__ == '__main__':
    # import uuid
    # import random
    # PomodoroTarget.update_data()
    # for i in range(2):
    #     todos = [f'test{i}', '@Python']
    #     programming = PomodoroTarget(str(uuid.uuid4()).split('-')[0], 150, todos)
    #     programming.progress = random.randint(10,150)
    # PomodoroTarget.save()
    # print(PomodoroTarget.all_targets)
    # print(f'extracting: {programming.extract_todos(todos)}')
    # # programming.update_data()
    # print(f'Progress: {programming.progress}')
    # sys.stdout.flush()
    # targs = PomodoroTarget.load()
    # for tar in targs:
    #     print(tar.title, tar.todos)
    # print(pt.all_targets)
    print('first message')
    print('second message')
    sys.stdout.flush()
