import re

MAX_LENGTH = 1024
MAX_LENGTH_STRESSOR = 128


def validate_aop_ke_inputs(input_string):
    regex_pattern = r'^\d{1,5}(,\d{1,5})*$'

    if len(input_string) is None:
        return True

    if len(input_string) > MAX_LENGTH:
        return False

    if re.match(regex_pattern, input_string):
        # Valid input
        return True
    # Did not match the regex expression, invalid user input
    return False
