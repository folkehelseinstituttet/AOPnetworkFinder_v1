import networkx

import app.SPARQL_QUERIES.visualizer_queries as sq
import app.model.aop as aop
import app.service.plot_aop_service as plot_aop
import networkx as nx
def visualize_aop_user_input(aop_ids, checkbox_gene):

    aop_rdf_data = []
    list_of_aop_objects = []
    genesCheckedFlag = checkbox_gene == '1' #Will be false if its not 1

    list_of_aops = aop_ids.split(',')
    #remove duplicates
    set_of_unique_aops = set(list_of_aops)

    filter_aops(list_of_aops)

    #One AOP
    if len(set_of_unique_aops) == 1:
        aop_rdf_data = sq.aop_dump(list_of_aops[0])
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
def filter_aops(aop_ids):
    print('Implement filter functionality')

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
