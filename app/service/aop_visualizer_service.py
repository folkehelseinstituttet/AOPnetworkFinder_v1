import networkx

import app.SPARQL_QUERIES.visualizer_queries as sq
import app.model.aop as aop
import app.service.plot_aop_service as plot_aop
import networkx as nx
import re
def visualize_aop_user_input(aop_ids, checkbox_gene, under_development_chx, endorsed_chx, under_review_chx, approved_chx):

    aop_rdf_data = []
    list_of_aop_objects = []
    filtered_aop_list = []

    genesCheckedFlag = checkbox_gene == '1' #Will be false if its not 1
    under_development_flag = under_development_chx == '1'
    endorsed_flag = endorsed_chx == '1'
    under_review_flag = under_review_chx == '1'
    approved_flag = approved_chx == '1'

    list_of_aops = aop_ids.split(',')
    #remove duplicates
    set_of_unique_aops = set(list_of_aops)

    only_valid_aops = filter_aops(under_development_flag, endorsed_flag, under_review_flag, approved_flag)
    if len(only_valid_aops) != 0:
        # Filter the list of aops
        filtered_aop_list = {x for x in set_of_unique_aops if x in only_valid_aops}
        #if filtered_aop_list is empty, the aops that the user requested was filtered out. return none and do nothing
        if len(filtered_aop_list) == 0:
            return None
        #update set_of_unique_aops with filtred aops
        set_of_unique_aops = filtered_aop_list

    #One AOP
    if len(set_of_unique_aops) == 1:
        aop_rdf_data = sq.aop_dump(next(iter(set_of_unique_aops)))
        print(aop_rdf_data)
        if len(aop_rdf_data['results']['bindings']) != 0:
            tmp_aop = aop.aop(aop_rdf_data, [], False)
            list_of_aop_objects.append(tmp_aop)

            aop_networkx_graph = plot_aop.plot(list_of_aop_objects, [])

            relabeled_graph = plot_aop.ke_obj_to_str(aop_networkx_graph, genesCheckedFlag)

            #can convert the networkx graph to a valid Cytoscape graph. Which is used to display the graph to the user in the front-end
            aop_cytoscape = networkx.cytoscape_data(relabeled_graph)
            return aop_cytoscape
    elif len(set_of_unique_aops) >= 1:

        return visualize_multiple_aops(set_of_unique_aops, genesCheckedFlag)

    return None



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

    #If list of statuses still is empty, return empty list and dont do any filtering
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

#Ability to display two or more AOPs
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

    #can convert the networkx graph to a valid Cytoscape graph. Which is used to display the graph to the user in the front-end
    aop_cytoscape = networkx.cytoscape_data(relabeled_graph)
    return aop_cytoscape
