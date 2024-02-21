import json

import networkx
from flask import jsonify

import app.SPARQL_QUERIES.visualizer_queries as sq
import app.model.aop as aop
import app.service.plot_aop_service as plot_aop
import re
import textdistance


def visualize_aop_user_input(aop_ids, checkbox_gene, under_development_chx, endorsed_chx, under_review_chx,
                             approved_chx):
    aop_rdf_data = []
    list_of_aop_objects = []
    filtered_aop_list = []

    genesCheckedFlag = checkbox_gene == '1'  # Will be false if its not 1
    under_development_flag = under_development_chx == '1'
    endorsed_flag = endorsed_chx == '1'
    under_review_flag = under_review_chx == '1'
    approved_flag = approved_chx == '1'

    # remove duplicates
    set_of_unique_aops = set(aop_ids)

    only_valid_aops = filter_aops(under_development_flag, endorsed_flag, under_review_flag, approved_flag)
    if len(only_valid_aops) != 0:
        # Filter the list of aops
        filtered_aop_list = {x for x in set_of_unique_aops if x in only_valid_aops}
        # if filtered_aop_list is empty, the aops that the user requested was filtered out. return none and do nothing
        if len(filtered_aop_list) == 0:
            return None, []
        # update set_of_unique_aops with filtred aops
        set_of_unique_aops = filtered_aop_list

    # One AOP
    if len(set_of_unique_aops) == 1:
        aop_rdf_data = sq.aop_dump(next(iter(set_of_unique_aops)))
        print(aop_rdf_data)
        if len(aop_rdf_data['results']['bindings']) != 0:
            tmp_aop = aop.aop(aop_rdf_data, [], False)
            list_of_aop_objects.append(tmp_aop)

            aop_networkx_graph = plot_aop.plot(list_of_aop_objects, [])

            relabeled_graph = plot_aop.ke_obj_to_str(aop_networkx_graph, genesCheckedFlag)

            # can convert the networkx graph to a valid Cytoscape graph. Which is used to display the graph to the user in the front-end
            aop_cytoscape = networkx.cytoscape_data(relabeled_graph)
            return aop_cytoscape, list(set_of_unique_aops)
    elif len(set_of_unique_aops) >= 1:

        return visualize_multiple_aops(set_of_unique_aops, genesCheckedFlag), list(set_of_unique_aops)

    return None, []


# function for filtering out aop_ids, depending on the checked values in the filtering section of the application.
def filter_aops(under_development_chx, endorsed_chx, under_review_chx, approved_chx):
    """AOP Filter RDF - give aop filter list values"""
    only_valid_aops = []
    list_of_statuses = []

    if under_development_chx:
        list_of_statuses.append('Under Development')
    if endorsed_chx:
        list_of_statuses.append('WPHA/WNT Endorsed')
    if under_review_chx:
        list_of_statuses.append('EAGMST Under Review')
    if approved_chx:
        list_of_statuses.append('EAGMST Approved')

    # If list of statuses still is empty, return empty list and dont do any filtering
    if len(list_of_statuses) == 0:
        return list_of_statuses

    json_aop_filter = sq.aop_status(list_of_statuses)

    '''Regex pattern for only numbers (extract AOP ID)'''
    pattern = r"\d+"

    print('Inside aop_filter_data')
    for aop_data in json_aop_filter['results']['bindings']:
        '''Extract AOP ID from json file using regex'''
        match = re.search(pattern, aop_data['aop_id']['value'])
        aop_id_string = match.group()

        only_valid_aops.append(aop_id_string)

    return only_valid_aops


# Ability to display two or more AOPs
def visualize_multiple_aops(set_of_unique_aops, genesCheckedFlag):
    aop_rdf_data = sq.multiple_aop_dump(set_of_unique_aops)
    list_of_aop_objects = []
    list_of_unique_ke = []

    for x in set_of_unique_aops:
        # TODO: Dont use aop_dump use multiple_aop_dump instead on final version
        tmp_aop_date = sq.aop_dump(x)
        if len(aop_rdf_data['results']['bindings']) != 0:
            new_aop = aop.aop(tmp_aop_date, list_of_unique_ke, False)
            list_of_aop_objects.append(new_aop)

    aop_networkx_graph = plot_aop.plot(list_of_aop_objects, list_of_unique_ke)

    relabeled_graph = plot_aop.ke_obj_to_str(aop_networkx_graph, genesCheckedFlag)

    # can convert the networkx graph to a valid Cytoscape graph. Which is used to display the graph to the user in the front-end
    aop_cytoscape = networkx.cytoscape_data(relabeled_graph)
    return aop_cytoscape


def merge_activation(unique_key_events):
    '''Merge button activation,
    After generating an AOP/AOP-networks, compare every unique KE with eachother using levenshtein distance
    If the distance is less than 7, activate the button and give the user the option to merge/not merge the KE.'''
    set_matched_tuples = set()
    algo = textdistance.Levenshtein()

    for outer_node in unique_key_events:
        for inner_node in unique_key_events:
            if outer_node == inner_node:
                # skip because we are comparing the same node.
                continue

            lev_distance = algo.distance(outer_node.lower(), inner_node.lower())

            if lev_distance < 7:
                '''Found a possible match, append the ke object'''
                print('merge possible ke: ', (outer_node, inner_node))
                ordered_tuple = tuple(sorted((outer_node, inner_node)))
                set_matched_tuples.add((ordered_tuple[0], ordered_tuple[1]))
    # convert set to list, as json serialization doesnt support sets
    list_matched_tuples = list(set_matched_tuples)
    return list_matched_tuples


def find_all_ke_from_json(json_string):
    ke_from_json = set()
    print('inside find all ke: {}'.format(json_string))
    for node in json_string["elements"]["nodes"]:
        ke_from_json.add(node["data"]["name"])

    print("ke_from_json: {}".format(ke_from_json))
    return ke_from_json


def extract_all_aops_given_ke_ids(ke_ids):
    ke_ids_split = ke_ids.split(',')
    ke_json = sq.ke_get_aopid(ke_ids_split)
    aop_id = [x['aop_id'] for x in ke_json['results']['bindings']]
    aop_id_2 = [x['value'] for x in aop_id]

    # extract AOP ids
    pattern_id = re.compile(r'\d+')
    aop_ids = [pattern_id.search(x).group() for x in aop_id_2 if pattern_id.search(x)]
    return aop_ids


def get_all_stressors_from_aop_wiki():
    list_of_stressors = []
    # query
    stressor_dict = sq.stressor_dump()
    for x in stressor_dict['results']['bindings']:
        # append to list_of_stressors
        list_of_stressors.append(x['str_title']['value'])
    return list_of_stressors


def extract_all_aop_id_from_given_stressor_name(stressor_name):
    aop_ids = []

    if stressor_name == '' or stressor_name is None:
        return aop_ids

    stressor_json = sq.stressor_AOP_finder(stressor_name)

    if len(stressor_json['results']['bindings']) >= 1:
        aop_id = [x['aop_id'] for x in stressor_json['results']['bindings']]
        aop_id_2 = [x['value'] for x in aop_id]
        # extract numbers
        pattern_id = re.compile(r'\d+')
        aop_ids = [pattern_id.search(x).group() for x in aop_id_2 if pattern_id.search(x)]
        return aop_ids

    return aop_ids
