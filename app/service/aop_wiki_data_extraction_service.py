import app.SPARQL_QUERIES.data_displayer_queries as dp_queries

def query_sparql(list_of_checkboxes, aop_input, ke_input):

    # FOR TESTING - REMOVE LATER
    # one_aop returns json_file and column header keys
    json_file, column_header = dp_queries.one_aop(list_of_checkboxes,
                                       ke_input, aop_input)

    #print(json_file)

    table_data_rows = len(json_file['results']['bindings'])
    table_data_columns = len(json_file['results']['bindings'][0])

    #print('column ', table_data_columns)

    # remove exclamation mark prefix from column_header list
    prefix_removed = [term.replace('?', '') for term in column_header if '?' in term]
    #print(prefix_removed)

    return json_file, prefix_removed

