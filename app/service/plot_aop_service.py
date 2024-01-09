import math

import networkx as nx


def plot(aop_list, unique_key_events):
    # if aop_list is empty, return and do nothing
    if len(aop_list) == 0:
        return

    # graph that visualise aop KE such as Mie, AO and regular KE
    aop_graph = nx.DiGraph()
    ####aop_graph = nx.MultiDiGraph()

    # if aop_list contains 1 or more aops. if more than 1 draw multiple aops
    if len(aop_list) > 0:
        ke_list = []
        if len(aop_list) == 1:
            # plot 1 aop
            print('plot 1 aop')
            # extract KE from the AOP object (KE = nodes in our graph)
            if aop_list[0] == 10:
                '''Hard coding for plotting KE Degree - Bad Implementation, (fix later)'''
                ke_obj_tuple = set()
                for ke_obj in unique_key_events:
                    ke_obj_tuple.add((ke_obj, ke_obj.get_ke_numerical_id))
                ke_list = ke_obj_tuple
            else:
                ke_list = aop_list[0].get_all_key_events()
        else:
            # mplot multiple_aop
            for x in unique_key_events:
                ke_list.append(x)

        print('inside plot:')
        for ke, id in ke_list:
            print('KE id: {}'.format(id))
            # add ke graph node to aop_graph
            if aop_graph.has_node(ke) == False:
                # add node to graph
                aop_graph.add_node(ke, label=ke.get_label(), ke_type=ke.print_ke_type())
                print('1 - label: {}, type: {}'.format(ke.get_label(),
                                                       ke.print_ke_type()))  # Remove later, used for debugging
                # add genes to graph
                gene_plotter_helper(ke, aop_graph)
            # upstream node
            if len(ke.get_upstream()) != 0:
                # check if upstream ke node exist in aop_graph, if no add node and its label
                for ke_up in ke.get_upstream():
                    node_in_graph = False
                    for node in list(aop_graph.nodes):
                        if not isinstance(node, str):
                            # not gene
                            if node.get_label() == ke_up.get_label():
                                # found node, update to True
                                node_in_graph = True
                    # if node_in_graph = False, add new node to aop_graph
                    if node_in_graph == False:
                        aop_graph.add_node(ke_up, label=ke_up.get_label(), ke_type=ke_up.print_ke_type())
                        print('2 - label: {}, type: {}'.format(ke.get_label(),
                                                               ke.print_ke_type()))  # Remove later, used for debugging
                        # add edge from current node to ke_up
                        aop_graph.add_edge(ke_up, ke)
                        # add genes to graph
                        gene_plotter_helper(ke_up, aop_graph)
                    else:
                        # node alraedy exist in graph.
                        # check if there is a edge between current node and upstream node
                        if aop_graph.has_edge(ke_up, ke) == False:
                            # don't exist, add edge
                            aop_graph.add_edge(ke_up, ke)
            # downstream node
            if len(ke.get_downstream()) != 0:
                # check if upstream ke node exist in aop_graph, if no add node and its label
                for ke_dwn in ke.get_downstream():
                    node_in_graph = False
                    for node in list(aop_graph.nodes):
                        if not isinstance(node, str):
                            if node.get_label() == ke_dwn.get_label():
                                # found node, update to True
                                node_in_graph = True
                    # if node_in_graph = False, add new node to aop_graph
                    if node_in_graph == False:
                        aop_graph.add_node(ke_dwn, label=ke_dwn.get_label(), ke_type=ke_dwn.print_ke_type())
                        print('3 - label: {}, type: {}'.format(ke.get_label(),
                                                               ke.print_ke_type()))  # Remove later, used for debugging
                        # add edge from current node to ke_up
                        aop_graph.add_edge(ke, ke_dwn)
                        # add genes to graph
                        gene_plotter_helper(ke_dwn, aop_graph)
                    else:
                        # node alraedy exist in graph.
                        # check if there is a edge between current node and upstream node
                        if aop_graph.has_edge(ke, ke_dwn) == False:
                            # don't exist, add edge
                            aop_graph.add_edge(ke, ke_dwn)

    else:
        # plot multiple aops.
        print('plot {} aops', len(aop_list))
        # need to check

    return aop_graph


'''Helper function for plotting genes'''
def gene_plotter_helper(ke_node, aop_graph):
    if ke_node.get_nr_genes() > 0:
        print('genes_nr', ke_node.get_list_of_genes())
        for genes in ke_node.get_list_of_genes():
            print(genes)
            aop_graph.add_node(genes, ke_type='genes')
            aop_graph.add_edge(genes, ke_node)


def ke_obj_to_str(aop_graph, bool_genes):
    '''Only used for exporting AOP_graph to Cytoscape
    Convert KE Object nodes to KE string nodes
    aop_graph (networkx)
    bool_genes, if true include genes, else don't include genes'''
    mapping_label = {}

    if bool_genes:
        print('include genes')
        print(aop_graph)
        for nodes in aop_graph:
            if not isinstance(nodes, str):
                tmp_ke_title = ''
                if type(nodes.get_title()) is dict:
                    tmp_ke_title = nodes.get_title()['value']
                else:
                    tmp_ke_title = nodes.get_title()
                mapping_label[nodes] = tmp_ke_title
            else:
                '''Genes'''
                genes_reduced = nodes[-4:]
                mapping_label[nodes] = genes_reduced
        '''Relabel nodes'''
        graph_relabeled = nx.relabel_nodes(aop_graph, mapping_label)
        return graph_relabeled
    else:
        print('dont include genes')
        no_genes_graph = aop_graph.copy()
        for nodes in aop_graph:
            if not isinstance(nodes, str):
                tmp_ke_title = ''
                if type(nodes.get_title()) is dict:
                    tmp_ke_title = nodes.get_title()['value']
                else:
                    tmp_ke_title = nodes.get_title()
                mapping_label[nodes] = tmp_ke_title
            else:
                '''delete gene nodes'''
                no_genes_graph.remove_node(nodes)

        '''Relabel nodes'''
        graph_relabeled = nx.relabel_nodes(no_genes_graph, mapping_label)
        return graph_relabeled
