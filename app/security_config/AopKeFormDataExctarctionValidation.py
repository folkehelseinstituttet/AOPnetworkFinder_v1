from wtforms import StringField
from flask_wtf import FlaskForm
from wtforms.validators import Length
from bleach import clean


class AopKeFormDataExtractionValidation(FlaskForm):
    searchFieldAOPs = StringField('searchFieldAOPs', validators=[Length(max=1024)])
    searchFieldKEs = StringField('searchFieldKEs', validators=[Length(max=1024)])


def sanitize_form_extraction(form):
    if form.searchFieldAOPs.data:
        form.searchFieldAOPs.data = clean(form.searchFieldAOPs.data)

    if form.searchFieldKEs.data:
        form.searchFieldKEs.data = clean(form.searchFieldKEs.data)
