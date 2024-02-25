from app import app
from flask import render_template, request, jsonify, send_file
import app.service.aop_visualizer_service as visualizer_sv
import app.service.aop_wiki_data_extraction_service as data_extraction_sv
import app.service.ke_degree_reader_service as ke_reader
import logging
##import pandas as pd
from io import BytesIO
from openpyxl import Workbook

# Page Routing
@app.route("/")
@app.route("/AOP_Visualizer")
def visualizer_page():
    return render_template('visualizer_page_one.html')


@app.route("/page1")
def page_two():
    return render_template('data_displayer_page_two.html')


#@app.route("/page2")
#def page_three():
#    return render_template('text_mining_page_three.html')


# Post requests
@app.route("/searchAops", methods=['POST'])
def search_aops():
    # Retrieve the query from the form
    aop_query = request.form.get('searchFieldAOP')
    ke_query = request.form.get('searchFieldKE')
    stressor_query = request.form.get('stressorDropdown')
    gene_checkbox = request.form.get('checkboxGene')
    filter_development_chx = request.form.get('checkboxDevelopment')
    filter_endorsed_chx = request.form.get('checkboxEndorsed')
    filter_review_chx = request.form.get('checkboxReview')
    filter_approved_chx = request.form.get('checkboxApproved')
    ke_degree = request.form.get("keDegree")

    logging.debug(f"aop_query from the search field in front-end {aop_query}")
    print('Test aopQuery: {}'.format(aop_query))
    print('Test gene_checkbox: {}'.format(gene_checkbox))
    print('ke_query: {}'.format(ke_query))
    print('ke_degree: {}'.format(ke_degree))

    # handle if there is no data
    if aop_query is None and ke_query in None and stressor_query is None:
        return render_template('visualizer_page_one.html', data=None)

    unique_ke_set = set()
    tmp_ke_id_set = set()
    aop_list = []
    if (ke_degree == '1' or ke_degree == '2') and ke_query != '':
        #ke_degree is either 1 or 2
        list_of_ke_ids = ke_query.split(',')
        unique_ke_set = ke_reader.read_ke_degree(ke_degree, list_of_ke_ids)
        if len(unique_ke_set) > 0:
            for ke_obj in unique_ke_set:
                tmp_ke_id_set.add(ke_obj.get_ke_numerical_id())
        tmp_ke_id_list = list(tmp_ke_id_set)
        mie_json_ke = ke_reader.mie_json_sparql(tmp_ke_id_list)
        ao_json_ke = ke_reader.ao_json_sparql(tmp_ke_id_list)
        mie_set = ke_reader.mie_reader_json(mie_json_ke)
        ao_set = ke_reader.ao_reader_json(ao_json_ke)
        for ke_obj in unique_ke_set:
            for mie_id in mie_set:
                if ke_obj.get_identifier() == mie_id:
                    ke_obj.set_mie()
                    break
            for ao_id in ao_set:
                if ke_obj.get_identifier() == ao_id:
                    ke_obj.set_ao()
                    break
            if ke_obj.print_ke_type() == 'None, need to declare type of key event':
                '''Ke type is KE'''
                ke_obj.set_ke()
    else:
        aop_list = visualizer_sv.extract_all_aops_given_ke_ids(ke_query)


    aop_query_list = aop_query.split(',')
    aop_stressor_list = visualizer_sv.extract_all_aop_id_from_given_stressor_name(stressor_query)
    aop_list.extend(aop_query_list)
    aop_list.extend(aop_stressor_list)
    #remove empty strings
    aop_list_filtered = [aop for aop in aop_list if aop != '']
    print(aop_list_filtered)

    if len(aop_list_filtered) == 0 and len(unique_ke_set) > 0:
        aop_cytoscape, aop_after_filter = visualizer_sv.visualize_only_ke_degrees(unique_ke_set)
    else:
        aop_cytoscape, aop_after_filter = visualizer_sv.visualize_aop_user_input(aop_list_filtered, gene_checkbox,
                                                                                 filter_development_chx,
                                                                                 filter_endorsed_chx, filter_review_chx,
                                                                                 filter_approved_chx, unique_ke_set)

    if aop_cytoscape is None:
        # Happens if all the aops the user inputted gets filtered out.
        return render_template('visualizer_page_one.html', data=None)

    #Similarity check
    unique_ke = visualizer_sv.find_all_ke_from_json(aop_cytoscape)
    ke_merge_possiblity = visualizer_sv.merge_activation(unique_ke)

    final_response = {
        'elements': aop_cytoscape['elements'],
        'merge_options:': ke_merge_possiblity,
        'aop_before_filter': aop_list_filtered,
        'aop_after_filter': aop_after_filter
    }
    print('Delete later')
    print('Output before sending to front-end: {}'.format(final_response))
    return jsonify(final_response)


@app.route("/data-extraction-submit", methods=['POST'])
def extract_from_aop_wiki():
    aop_input = request.form.get('searchFieldAOPs')
    ke_input = request.form.get('searchFieldKEs')
    print(aop_input)
    print(ke_input)
    if aop_input == '':
        ke_list_tuple = [("In AOP", request.form.get("ke_chx_in_aop")),
                         ("ke stressor", request.form.get("ke_chx_stressor")),
                         ("ke genes", request.form.get("ke_chx_genes")),
                         ("ke cell type context", request.form.get("ke_chx_cell_type")),
                         ("ke description", request.form.get("ke_chx_description")),
                         ("ke measurements", request.form.get("ke_chx_measurements"))]
        print('aop: {}'.format(aop_input))
        print('ke: {}'.format(ke_input))
        json_file, column_header = data_extraction_sv.query_sparql(ke_list_tuple, aop_input, ke_input)
        print("aop_list_tuples {}".format(ke_list_tuple))
        print("json: {}".format(json_file))
        print("header: {}".format(column_header))
        return jsonify(json_file)
    else:
        aop_list_tuple = [("abstract", request.form.get("aop_chx_abstract")),
                          ("stressor", request.form.get("aop_chx_stressor")),
                          ("ke", request.form.get("aop_chx_ke")),
                          ("mie", request.form.get("aop_chx_mie")),
                          ("ao", request.form.get("aop_chx_ao")),
                          ("aop_author", request.form.get("aop_chx_author"))]
        print('aop: {}'.format(aop_input))
        print('ke: {}'.format(ke_input))
        json_file, column_header = data_extraction_sv.query_sparql(aop_list_tuple, aop_input, ke_input)
        print("aop_list_tuples {}".format(aop_list_tuple))
        print("json: {}".format(json_file))
        print("header: {}".format(column_header))
        return jsonify(json_file)

    return render_template('data_displayer_page_two.html', data=None)



@app.route('/save-excel', methods=['POST'])
def save_excel():

    data = request.json['data']

    wb = Workbook()
    ws = wb.active

    if data:
        ws.append(list(data[0].keys()))

    for item in data:
        ws.append(list(item.values()))

    excel_file = BytesIO()
    wb.save(excel_file)
    excel_file.seek(0)

    return send_file(excel_file, attachment_filename="table_data.xlsx", as_attachment=True, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')


@app.route('/get_stressors')
def get_stressors():
    # Populate data with stressor name
    stressor_list = visualizer_sv.get_all_stressors_from_aop_wiki()
    print(stressor_list)

    return jsonify(stressor_list)