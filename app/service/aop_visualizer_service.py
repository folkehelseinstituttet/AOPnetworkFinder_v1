import networkx

import app.SPARQL_QUERIES.visualizer_queries as sq
import app.model.aop as aop
import app.service.plot_aop_service as plot_aop
import networkx as nx
def visualize_aop_user_input(aop_ids):

    aop_rdf_data = []
    list_of_aop_objects = []

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

            #TODO: Implement the ability to enable and disable genes. Currently default value false
            relabeled_graph = plot_aop.ke_obj_to_str(aop_networkx_graph, False)

            #can convert the networkx graph to a valid Cytoscape graph. Which is used to display the graph to the user in the front-end
            aop_cytoscape = networkx.cytoscape_data(relabeled_graph)
            return aop_cytoscape

    elif len(set_of_unique_aops) > 1:
        aop_rdf_data = sq.multiple_aop_dump(list_of_aops)

    return None



# function for filtering out aop_ids, depending on the checked values in the filtering section of the application.
def filter_aops(aop_ids):
    print('Implement filter functionality')
