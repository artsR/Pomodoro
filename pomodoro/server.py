import json
from flask import Flask, request, render_template, redirect, url_for, session
from flask_wtf import FlaskForm
from wtforms import StringField, FloatField
from wtforms.validators import InputRequired, NumberRange
from werkzeug.exceptions import HTTPException
from config import Config
from pomodoro import PomodoroTarget, PomodoroTargetError


app = Flask(__name__)
app.config.from_object(Config)


@app.errorhandler(Exception)
def error_handler(err):
    if isinstance(err, PomodoroTargetError):
        msg = err.args[0]
        message = json.dumps({'text': msg['text'], 'type': msg['type']})
        return redirect(url_for('dashboard', message=message))
    elif isinstance(err, HTTPException):
        response = err.get_response()
        message = json.dumps({
            'type': 'danger',
            'code': err.code,
            'text': err.name,
            'description': err.description,
        })
        response.data = json.dumps({'message': message, 'targets': []})
        response.content_type = 'application/json'
        return response


def is_valid(json_data):
    required_fields = ['target_title', 'target_hrs', 'todos']
    return all(
        field in json_data and json_data[field]
        for field in required_fields
    )



@app.route('/targets/', methods=['GET'])
@app.route('/targets/<message>', methods=['GET'])
def dashboard(message=None):
    all_targets = PomodoroTarget.load()
    targets_dict = {'targets': [target.to_dict() for target in all_targets]}
    if message is not None:
        targets_dict.update({'message': message})

    return targets_dict


@app.route('/new_target', methods=['POST'])
def new_target():
    request_data = request.get_json(silent=True)
    if (request_data is None) or (not is_valid(request_data)):
        message = json.dumps({'text': 'Provided invalid data', 'type': 'danger'})
        return redirect(url_for('dashboard', message=message))

    json_data = {
        k: v for k,v in request_data.items()
        if k not in ['progress']
    }
    all_targets = PomodoroTarget.load()
    PomodoroTarget.all_targets = all_targets

    new_target = PomodoroTarget(**json_data)
    PomodoroTarget.save()
    message = json.dumps({'text': 'Data save successfully', 'type': 'success'})

    return redirect(url_for('dashboard', message=message))


@app.route('/refresh', methods=['GET'])
def refresh():
    all_targets = PomodoroTarget.load()
    all_targets = [target.refresh() for target in all_targets]
    PomodoroTarget.all_targets = all_targets
    PomodoroTarget.save()

    if session.get('message', None) is not None:
        message = session.pop('message')
    else:
        message = json.dumps({'text': 'Data has been refreshed', 'type': 'success'})

    return redirect(url_for('dashboard', message=message))


@app.route('/edit_targets', methods=['POST'])
def edit_targets():
    received_targets = request.get_json(silent=True)
    if received_targets is None:
        message = json.dumps({'text': 'Provided invalid data', 'type': 'danger'})
        return redirect(url_for('dashboard', message=message))

    all_targets = PomodoroTarget.load()
    modified_targets = [
        target for target in all_targets if target.title in received_targets
    ]

    for target in modified_targets:
        if received_targets[target.title]:
            target.todos = received_targets[target.title]

    PomodoroTarget.all_targets = modified_targets
    PomodoroTarget.save()
    message = json.dumps({'text': 'Modification has been saved', 'type': 'success'})

    return redirect(url_for('dashboard', message=message))


@app.route('/edit_daily', methods=['POST'])
def edit_daily():
    received_target = request.get_json(silent=True)
    if received_target is None:
        message = json.dumps({'text': 'Provided invalid data', 'type': 'danger'})
        return redirect(url_for('dashboard', message=message))

    all_targets = PomodoroTarget.load()
    modified_target = [
        target for target in all_targets if target.title == received_target.title
    ]

    target = modified_target[0]
    target.per_day_init = received_target.per_day
    target.free_days = received_target.free_days

    PomodoroTarget.save()

    session['message'] = json.dumps({'text': 'Daily data has been saved',
                                    'type': 'success'})

    return redirect(url_for('refresh'))


@app.route('/update_data', methods=['POST'])
def update_data():
    """Downloads CSV file with Pomodoros from Dropbox."""
    PomodoroTarget.update_data()
    message = json.dumps({'text': 'Logs downloaded successfully', 'type': 'success'})

    return {'message': message}



if __name__ == '__main__':
    app.run(host='localhost', port=5050)
