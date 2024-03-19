'''Read the json file and produce KE Objects with their corresponding upstream and downstream KE Objects'''
import app.model.key_event as ke
import app.SPARQL_QUERIES.visualizer_queries as vq


def read_ke_degree(degree, ke_ids):
    '''read and initialize KE objects'''
    ke_obj_set = set()  # dont include duplicates

    if degree == '1':
        ke_degree_json = helper_ke_degree(degree, ke_ids)
        ke_obj_set = read_ke_degree_1(ke_degree_json)
    elif degree == '2':
        ke_degree_json = helper_ke_degree(degree, ke_ids)
        ke_obj_set = read_ke_degree_2(ke_degree_json)

    '''return list of KE objects'''
    return ke_obj_set


def read_ke_degree_1(ke_degree_json):
    '''reads the json file produced from the sparql query'''
    ke_set = set()

    ke_root_found = False
    root_ke = ''
    for ke_obj in ke_degree_json['results']['bindings']:
        '''ke_id is the root node in our degree 1'''
        if not ke_root_found:
            # Generate Root KE - Only once
            root_ke = ke.key_event(ke_obj['ke_id'], ke_obj['keRoot_label'], ke_obj['keRoot_name'], True)
            # add root ke to ke_set
            ke_set.add(root_ke)
            ke_root_found = True

        if 'ke_up' in ke_obj:
            '''Initiate upstream ke'''
            upstream_ke = ke.key_event(ke_obj['ke_up'], ke_obj['keUp_label'], ke_obj['keUp_name'], True)
            root_ke.add_upstream(upstream_ke)
            ke_set.add(upstream_ke)

        if 'ke_dwn' in ke_obj:
            '''Initiate upstream ke'''
            downstream_ke = ke.key_event(ke_obj['ke_dwn'], ke_obj['keDwn_label'], ke_obj['keDwn_name'], True)
            root_ke.add_downstream(downstream_ke)
            ke_set.add(downstream_ke)

    return ke_set


def read_ke_degree_2(ke_degree_json):
    '''reads the json file produced from the sparql query'''
    ke_set = set()
    # ke_list_tuple()
    ke_root_found = False
    root_ke = ''
    for ke_obj in ke_degree_json['results']['bindings']:
        '''ke_id is the root node in our degree 1'''
        if not ke_root_found:
            # Generate Root KE - Only once
            root_ke = ke.key_event(ke_obj['ke_id'], ke_obj['keRoot_label'], ke_obj['keRoot_name'], True)
            # add root ke to ke_set
            ke_set.add(root_ke)
            ke_root_found = True

        if 'lvl_1_up' in ke_obj:
            '''Initiate upstream ke'''
            upstream_ke = ke.key_event(ke_obj['lvl_1_up'], ke_obj['lvl_1_up_label'], ke_obj['lvl_1_up_name'], True)
            obj_exist = check_set(upstream_ke.get_identifier(), ke_set)
            if obj_exist is not None:
                '''object already exist, do not add the object as upstream to root and dont add to ke_set()'''
                obj_exist_next_lvl, flag_ke = lvl_helper(2, ke_obj, ke_set)
                if obj_exist_next_lvl is not None:
                    check_this_obj = check_set(obj_exist_next_lvl.get_identifier(), ke_set)
                    if check_this_obj is not None:
                        '''object already exist lvl 2, do not add the object as upstream to root and dont add to ke_set()'''
                        # just add upstream or downstream
                        if flag_ke == 1:
                            '''add as upstream'''
                            obj_exist.add_upstream(check_this_obj)
                        else:
                            '''add as downstrea,'''
                            obj_exist.add_downstream(check_this_obj)
                    else:
                        '''object doesnt exist in ke_set() make new object for next lvl'''
                        next_lvl_up = next_lvl(2, ke_obj, '_up')
                        next_lvl_dwn = next_lvl(2, ke_obj, '_dwn')
                        if next_lvl_up is not None:
                            obj_exist.add_upstream(next_lvl_up)
                            ke_set.add(next_lvl_up)

                        if next_lvl_dwn is not None:
                            obj_exist.add_downstream(next_lvl_dwn)
                            ke_set.add(next_lvl_dwn)

            else:
                '''object doesnt exist, add as upstream to root and add to ke_set'''
                root_ke.add_upstream(upstream_ke)
                # upstream_ke.add_downstream(root_ke)
                ke_set.add(upstream_ke)

                '''Check next lvl - obj_exist_next_lvl is a tmp KE_object.'''
                obj_exist_next_lvl, flag_ke = lvl_helper(2, ke_obj, ke_set)
                if obj_exist_next_lvl is not None:
                    check_this_obj = check_set(obj_exist_next_lvl.get_identifier(), ke_set)

                    if check_this_obj is not None:
                        '''object already exist lvl 2, do not add the object as upstream to root and dont add to ke_set()'''
                        # just add upstream or downstream
                        if flag_ke == 1:
                            '''add as upstream'''
                            upstream_ke.add_upstream(check_this_obj)
                        else:
                            '''add as downstrea,'''
                            upstream_ke.add_downstream(check_this_obj)
                    else:
                        '''object doesnt exist in ke_set() make new object for next lvl'''
                        next_lvl_up = next_lvl(2, ke_obj, '_up')
                        next_lvl_dwn = next_lvl(2, ke_obj, '_dwn')
                        if next_lvl_up is not None:
                            upstream_ke.add_upstream(next_lvl_up)
                            ke_set.add(next_lvl_up)

                        if next_lvl_dwn is not None:
                            upstream_ke.add_downstream(next_lvl_dwn)
                            ke_set.add(next_lvl_dwn)

        if 'lvl_1_dwn' in ke_obj:
            '''Initiate upstream ke'''
            downstream_ke = ke.key_event(ke_obj['lvl_1_dwn'], ke_obj['lvl_1_dwn_label'], ke_obj['lvl_1_dwn_name'], True)
            obj_exist = check_set(downstream_ke.get_identifier(), ke_set)
            if obj_exist is not None:
                '''object already exist, do not add the object as downstream to root and dont add to ke_set()'''
                obj_exist_next_lvl, flag_ke = lvl_helper(2, ke_obj, ke_set)
                if obj_exist_next_lvl is not None:
                    check_this_obj = check_set(obj_exist_next_lvl.get_identifier(), ke_set)

                    if check_this_obj is not None:
                        '''object already exist lvl 2, do not add the object as downstream to root and dont add to ke_set()'''
                        # just add upstream or downstream
                        if flag_ke == 1:
                            '''add as upstream'''
                            obj_exist.add_upstream(check_this_obj)
                        else:
                            '''add as downstrea,'''
                            obj_exist.add_downstream(check_this_obj)
                    else:
                        '''object doesnt exist in ke_set() make new object for next lvl'''
                        next_lvl_up = next_lvl(2, ke_obj, '_up')
                        next_lvl_dwn = next_lvl(2, ke_obj, '_dwn')
                        if next_lvl_up is not None:
                            obj_exist.add_upstream(next_lvl_up)
                            ke_set.add(next_lvl_up)

                        if next_lvl_dwn is not None:
                            obj_exist.add_downstream(next_lvl_dwn)
                            ke_set.add(next_lvl_dwn)

            else:
                '''object doesnt exist, add as upstream to root and add to ke_set'''
                root_ke.add_downstream(downstream_ke)
                # downstream_ke.add_upstream(root_ke)
                ke_set.add(downstream_ke)

                '''Check next lvl'''
                obj_exist_next_lvl, flag_ke = lvl_helper(2, ke_obj, ke_set)
                if obj_exist_next_lvl is not None:
                    check_this_obj = check_set(obj_exist_next_lvl.get_identifier(), ke_set)
                    if check_this_obj is not None:
                        '''object already exist lvl 2, do not add the object as upstream to root and dont add to ke_set()'''
                        # just add upstream or downstream
                        if flag_ke == 1:
                            '''add as upstream'''
                            downstream_ke.add_upstream(check_this_obj)
                        else:
                            '''add as downstrea,'''
                            downstream_ke.add_downstream(check_this_obj)
                    else:
                        '''object doesnt exist in ke_set() make new object for next lvl'''
                        next_lvl_up = next_lvl(2, ke_obj, '_up')
                        next_lvl_dwn = next_lvl(2, ke_obj, '_dwn')
                        if next_lvl_up is not None:
                            downstream_ke.add_upstream(next_lvl_up)
                            ke_set.add(next_lvl_up)

                        if next_lvl_dwn is not None:
                            downstream_ke.add_downstream(next_lvl_dwn)
                            ke_set.add(next_lvl_dwn)

    return ke_set


def check_set(numerical_id, ke_set):
    '''Helper function for degree 2, 3 and 4'''

    for ke_obj in ke_set:
        if numerical_id == ke_obj.get_identifier():
            return ke_obj

    empty_obj = None
    return None


def lvl_helper(lvl, ke_obj, ke_set):
    '''Helper function for degree 2, 3, 4
    return a possible ke_object'''
    node_up = False
    node_dwn = False
    last_lvl = lvl
    if last_lvl == 2:
        degree = str(lvl)
        x_lvl_up = 'lvl_' + degree + '_up'
        x_lvl_dwn = 'lvl_' + degree + '_dwn'

        if x_lvl_up in ke_obj:
            '''Initiate upstream ke'''
            upstream_ke = ke.key_event(ke_obj[x_lvl_up], ke_obj[x_lvl_up + '_label'], ke_obj[x_lvl_up + '_name'], True)
            # node_up = True
            return upstream_ke, 1

        if x_lvl_dwn in ke_obj:
            '''Initiate upstream ke'''
            downstream_ke = ke.key_event(ke_obj[x_lvl_dwn], ke_obj[x_lvl_dwn + '_label'], ke_obj[x_lvl_dwn + '_name'],
                                         True)
            # node_dwn = True
            return downstream_ke, 2

    return None, 0


def next_lvl(degree, ke_obj, direction):
    x_lvl_direction = 'lvl_' + str(degree) + direction
    if x_lvl_direction in ke_obj:
        '''Initiate upstream ke'''
        ke_object = ke.key_event(ke_obj[x_lvl_direction], ke_obj[x_lvl_direction + '_label'],
                                 ke_obj[x_lvl_direction + '_name'], True)
        # node_up = True
        return ke_object

    return None


def mie_reader_json(mie_json):
    '''helper function that reads a json file and return a set of mie identifiers'''
    mie_set = set()
    for ke_obj in mie_json['results']['bindings']:
        if 'mie' in ke_obj:
            # print(ke_obj['ke'])
            mie_set.add(ke_obj['ke']['value'])

    return mie_set


def ao_reader_json(ao_json):
    '''helper function that reads a json file and return a set of ao identifiers'''
    ao_set = set()
    for ke_obj in ao_json['results']['bindings']:
        if 'ao' in ke_obj:
            ao_set.add(ke_obj['ke']['value'])

    return ao_set


def helper_ke_degree(degree, ke_ids):
    '''only apply degree on ke_id from the ke_id_list'''

    '''depending on the node degree, apply the right sparql query,'''
    ke_degree_json = ''
    if degree == '1':
        ke_degree_json = vq.ke_degree_1_multiple_dump(ke_ids)
    elif degree == '2':
        ke_degree_json = vq.ke_degree_2_multiple_dump(ke_ids)

    return ke_degree_json


def mie_json_sparql(ke_ids):
    return vq.ke_get_mie(ke_ids)


def ao_json_sparql(ke_ids):
    return vq.ke_get_ao(ke_ids)
