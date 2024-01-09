from app.SPARQL_QUERIES.visualizer_queries import *
import re
from app.model.key_event import *


class aop:

    def __init__(self, json_dictionary, unique_ke_list, api_flag):
        self.json_dictionary = json_dictionary
        self.aop_identifier = 0
        self.molecular_init_event = []
        self.adverse_outcome = []
        self.list_of_key_events = []  # type key_event, tuple (key_event_object, ke_numerical_id)
        print('read dict')
        if api_flag == False:
            self.read_json(unique_ke_list)
            # add the json_dict again and add upstream/downstream for each key. using the list 'self.list_of_key_events'
            self.add_up_and_downstream()
        else:
            '''Use API json response instead'''
            print('USING API')
            self.read_json_api(unique_ke_list)

    # Read dictionary and give values to the aop and all key events.
    def read_json(self, existing_ke):
        # extract aop_id
        tmp_id = [x['aop_id'] for x in self.json_dictionary['results']['bindings']]
        for x in tmp_id:
            if self.aop_identifier == 0:
                print('yes')
                # update identifier and break loop.
                pattern = "\\d+$"  # pattern
                self.aop_identifier = re.findall(pattern, x['value'])  # return a list of single AOP id
                break

        print('inside aop class: read_json')
        # loop through the dictionary, initiate and append key_events to the list_of_key_events

        # find MIE and initiate a key_event object. append to molecular_init_event list
        aop_mie = []
        try:
            aop_mie = [x['MIE'] for x in self.json_dictionary['results']['bindings']]
        except KeyError as e:
            print('The AOP have no MIE \n {}'.format(e))

        tmp_mie = []  # contains mie id not object. (dont include duplicates)
        for x in aop_mie:
            if x['value'] not in tmp_mie:
                tmp_mie.append(x['value'])
                print(x['value'])

        # find all AO
        print('AO')
        #if len(self.aop_identifier[0]) > 0:
        print('json_dict: ', self.json_dictionary)
        print(self.aop_identifier)
        '''if AOP Identifier = 0, return none (query found an AOP, but got nothing from the sparql query)'''
        #TODO: Rewrite the sparql query (fix the small bug)
        if self.aop_identifier == 0:
            '''Temporarily fix'''
            return
        list_ao = ao_dump(self.aop_identifier[0])  # query to find all AO
        list_ao_data = []

        # find all key_events including MIE. Initiate and append to lists.
        ##no dupes
        tmp_ke = []

        # initiate and append AO
        print('initiate AO')
        for x in list_ao['results']['bindings']:
            if x['ao']['value'] not in list_ao_data:
                tmp_ke.append(x['ao']['value'])
                list_ao_data.append(x['ao']['value'])  # no duplicates

                extract_id = "\\d+$"  # pattern
                extracted_id = re.findall(extract_id, x['ao']['value'])
                retrive_ke = self.get_index_of_tuple_list(0, x['ao']['value'], existing_ke)
                if retrive_ke is None:
                    #there are no key events in the 'existing_ke' list that has the extracted_id's value
                    #initiate new AO

                    ##initate AO
                    ao_identifier = x['ao_id']['value']
                    ao_label = x['label']['value']
                    ao_title = x['name']['value']
                    new_ao = key_event(ao_identifier, ao_label, ao_title, True)
                    new_ao.set_ao()

                    self.adverse_outcome.append(new_ao)
                    self.list_of_key_events.append((new_ao, new_ao.get_ke_numerical_id()))
                    #append to existing_ke list
                    existing_ke.append((new_ao, new_ao.get_ke_numerical_id()))
                    new_ao.test_print_all()
                else:
                    print('retrieve AOP')
                    #retrieved_ke is not None, but is a Key event object (don't initiate new key event)
                    #append retrieved_ke to list
                    self.adverse_outcome.append(retrive_ke)
                    self.list_of_key_events.append((existing_ke[retrive_ke][0], existing_ke[retrive_ke][0].get_ke_numerical_id()))

        for x in self.json_dictionary['results']['bindings']:
            if x['KE_up']['value'] not in tmp_ke:
                tmp_ke.append(x['KE_up']['value'])
                # check if ke is a mie
                if x['KE_up']['value'] in tmp_mie:
                    # initiate
                    extract_id = "\\d+$"  # pattern
                    extracted_id = re.findall(extract_id, x['KE_up']['value'])
                    retrive_ke = self.get_index_of_tuple_list(0, x['KE_up']['value'], existing_ke)
                    print('MIE_retrive value check: ',retrive_ke)
                    if retrive_ke is None:
                        mie_identifier = x['ke_id']['value']
                        mie_label = x['ke_label']['value']
                        mie_title = x['ke_title']['value']
                        # key_event object
                        new_mie = key_event(mie_identifier, mie_label, mie_title, True)
                        new_mie.set_mie()

                        # check if x['ke_genes']['value'] column exist, if not do nothing.
                        try:
                            gene_id = x['ke_genes']['value']
                            new_mie.add_genes(gene_id)
                        except KeyError as e:
                            print(e)
                        # append to both molecular_initiating_list and list_of_key_events
                        self.molecular_init_event.append(new_mie)
                        self.list_of_key_events.append((new_mie, new_mie.get_ke_numerical_id()))
                        # append to existing_ke list
                        existing_ke.append((new_mie, new_mie.get_ke_numerical_id()))

                        new_mie.test_print_all()
                    else:
                        print('retrive MIE')
                        # retrieved_ke is not None, but is a Key event object (don't initiate new key event)
                        # append retrieved_ke to list
                        self.molecular_init_event.append(retrive_ke)
                        self.list_of_key_events.append((existing_ke[retrive_ke][0], existing_ke[retrive_ke][0].get_ke_numerical_id()))
                else:
                    extract_id = "\\d+$"  # pattern
                    extracted_id = re.findall(extract_id, x['KE_up']['value'])
                    retrive_ke = self.get_index_of_tuple_list(0, x['KE_up']['value'], existing_ke)
                    if retrive_ke is None:

                        # initiate ordinary KE,
                        ke_identifier = x['ke_id']['value']
                        ke_label = x['ke_label']['value']
                        ke_title = x['ke_title']
                        # key_event object
                        new_ke = key_event(ke_identifier, ke_label, ke_title, True)
                        new_ke.set_ke()

                        # check if x['ke_genes']['value'] column exist, if not do nothing.
                        try:
                            print(x['ke_genes']['value'])
                            gene_id = x['ke_genes']['value']
                            new_ke.add_genes(gene_id)
                        except KeyError as e:
                            print(e)
                        # append to both molecular_initiating_list and list_of_key_events
                        self.list_of_key_events.append((new_ke, new_ke.get_ke_numerical_id()))
                        existing_ke.append((new_ke, new_ke.get_ke_numerical_id()))
                        new_ke.test_print_all()
                    else:
                        print('Retrieve KE')
                        # retrieved_ke is not None, but is a Key event object (don't initiate new key event)
                        # append retrieved_ke to list
                        self.list_of_key_events.append(
                            (existing_ke[retrive_ke][0], existing_ke[retrive_ke][0].get_ke_numerical_id()))

            else:
                # the key event exist, get the key_event object and append genes

                # chech if x['ke_genes']['value'] column exist, if not do nothing.
                try:
                    # find the object at try to append the genes (if it exist)
                    print(x['ke_genes']['value'])
                    # TODO: find another solution, inefficient O(n^2) (code still works)
                    for i, _ in self.list_of_key_events:
                        if i.get_identifier() == x['ke_id']['value']:
                            i.add_genes(x['ke_genes']['value'])

                except KeyError as e:
                    print(e)

        #last, check if there is any KE_downstream that has not been appended to self.list_of_key_events
        for x in self.json_dictionary['results']['bindings']:
            if x['KE_dwn']['value'] not in tmp_ke:
                tmp_ke.append(x['KE_dwn']['value'])
                # check if ke is a mie
                if x['KE_dwn']['value'] in tmp_mie:
                    # initiate
                    extract_id = "\\d+$"  # pattern
                    extracted_id = re.findall(extract_id, x['KE_dwn']['value'])
                    retrive_ke = self.get_index_of_tuple_list(0, x['KE_dwn']['value'], existing_ke)
                    if retrive_ke is None:
                        mie_identifier = x['ke_dwn_id']['value']
                        mie_label = x['ke_dwn_label']['value']
                        mie_title = x['ke_dwn_title']['value']
                        # key_event object
                        new_mie = key_event(mie_identifier, mie_label, mie_title, True)
                        new_mie.set_mie()

                        # check if x['ke_genes']['value'] column exist, if not do nothing.
                        try:
                            gene_id = x['ke_dwn_genes']['value']
                            new_mie.add_genes(gene_id)
                        except KeyError as e:
                            print(e)
                        # append to both molecular_initiating_list and list_of_key_events
                        self.molecular_init_event.append(new_mie)
                        self.list_of_key_events.append((new_mie, new_mie.get_ke_numerical_id()))
                        # append to existing_ke list
                        existing_ke.append((new_mie, new_mie.get_ke_numerical_id()))

                        new_mie.test_print_all()
                    else:
                        # retrieved_ke is not None, but is a Key event object (don't initiate new key event)
                        # append retrieved_ke to list
                        self.molecular_init_event.append(retrive_ke)
                        self.list_of_key_events.append(
                            (existing_ke[retrive_ke][0], existing_ke[retrive_ke][0].get_ke_numerical_id()))
                else:
                    extract_id = "\\d+$"  # pattern
                    extracted_id = re.findall(extract_id, x['KE_dwn']['value'])
                    retrive_ke = self.get_index_of_tuple_list(0, x['KE_dwn']['value'], existing_ke)
                    if retrive_ke is None:

                        # initiate ordinary KE,
                        ke_identifier = x['ke_dwn_id']['value']
                        ke_label = x['ke_dwn_label']['value']
                        ke_title = x['ke_dwn_title']
                        # key_event object
                        new_ke = key_event(ke_identifier, ke_label, ke_title, True)
                        new_ke.set_ke()

                        # check if x['ke_genes']['value'] column exist, if not do nothing.
                        try:
                            print(x['ke_dwn_genes']['value'])
                            gene_id = x['ke_dwn_genes']['value']
                            new_ke.add_genes(gene_id)
                        except KeyError as e:
                            print(e)
                        # append to both molecular_initiating_list and list_of_key_events
                        self.list_of_key_events.append((new_ke, new_ke.get_ke_numerical_id()))
                        existing_ke.append((new_ke, new_ke.get_ke_numerical_id()))
                        new_ke.test_print_all()
                    else:
                        # retrieved_ke is not None, but is a Key event object (don't initiate new key event)
                        # append retrieved_ke to list
                        self.list_of_key_events.append(
                            (existing_ke[retrive_ke][0], existing_ke[retrive_ke][0].get_ke_numerical_id()))

            else:
                # the key event exist, get the key_event object and append genes

                # chech if x['ke_genes']['value'] column exist, if not do nothing.
                try:
                    # find the object at try to append the genes (if it exist)
                    print(x['ke_dwn_genes']['value'])
                    # TODO: find another solution, inefficient O(n^2) (code still works)
                    for i, _ in self.list_of_key_events:
                        if i.get_identifier() == x['ke_dwn_id']['value']:
                            i.add_genes(x['ke_dwn_genes']['value'])

                except KeyError as e:
                    print(e)

        for x in existing_ke:
            print('inside -- existing_ke -- in json_read {}'.format(x))

        for x in tmp_ke:
            print('inside tmp_ke: {}'.format(x))

        for x in self.list_of_key_events:
            print('inside self.list_of_key_events {}'.format(x))
            print('KE type: {}'.format(x[0].print_ke_type()))

    # find and add pointers to upstream and downstream ke, for each KE in the list 'self.list_of_key_events'
    def add_up_and_downstream(self):
        #read the json_dictionary again, but only look for upstream and downstream values
        for x in self.json_dictionary['results']['bindings']:

            index_ke_upstream = self.get_index_of_tuple_list(0, x['KE_up']['value'], self.list_of_key_events)
            index_ke_downstream = self.get_index_of_tuple_list(0, x['KE_dwn']['value'], self.list_of_key_events)

            if index_ke_upstream != None:
                #current KE. If index_ke_downstream != none. add the KE object as downstream ke pointer for current KE
                if index_ke_downstream != None:
                    print('Added upstream and downstream pointers')
                    #current KE object from self.list_of_ke
                    self.list_of_key_events[index_ke_upstream][0].add_downstream(self.list_of_key_events[index_ke_downstream][0])
                    #do the reverse for downstream KE object, add upstream pointer to the current KE
                    self.list_of_key_events[index_ke_downstream][0].add_upstream(self.list_of_key_events[index_ke_upstream][0])

    #self.list_of_key_events contains list of tuples (ke_object, ke_numerical_id)
    def get_index_of_tuple_list(self, tuple_index, search_ke_id, ke_list):

        #if list is empty return none
        '''if not ke_list:
            return None'''

        for list_index, t in enumerate(ke_list):
            print('inside get_index_of_tuple_list: {}, search_ke_id: {}'.format( t[tuple_index].get_identifier(), search_ke_id))
            if t[tuple_index].get_identifier() == search_ke_id:
                #found position
                return list_index
        return None

    def read_json_api(self, existing_ke):

        '''store the ke in their temporarily list (just IDs, no objects)'''
        print('INSIDE READ JSON API')
        tmp_mie_list = []
        tmp_ke_list = []
        tmp_ao_list = []
        '''mie from API'''
        for y in self.json_dictionary['aop_mies']:
            print(y)
            tmp_mie_list.append(y)

        '''AO from API'''
        for y in self.json_dictionary['aop_aos']:
            print(y)
            tmp_ao_list.append(y)
        '''KE from API'''
        for y in self.json_dictionary['aop_kes']:
            print(y)
            tmp_ke_list.append(y)

        print(tmp_ao_list)
        for ao_ke in tmp_ao_list:
            print(ao_ke['event_id'])
            retrive_ke = self.get_index_of_tuple_list(0, ao_ke['event_id'], existing_ke)
            print('ao ret: ', retrive_ke)
            if retrive_ke is None:
                #there are no key events in the 'existing_ke' list that has the extracted_id's value
                #initiate new AO

                ##initate AO
                ao_identifier = 'https://identifiers.org/aop.events/' + str(ao_ke['event_id'])
                ao_label = 'KE ' + str(ao_ke['event_id'])
                ao_title = ao_ke['event']
                new_ao = key_event(ao_identifier, ao_label, ao_title, True)
                new_ao.set_ao()

                self.adverse_outcome.append(new_ao)
                self.list_of_key_events.append((new_ao, new_ao.get_ke_numerical_id()))
                #append to existing_ke list
                existing_ke.append((new_ao, new_ao.get_ke_numerical_id()))
                new_ao.test_print_all()
            else:
                print('retrieve AOP')
                #retrieved_ke is not None, but is a Key event object (don't initiate new key event)
                #append retrieved_ke to list
                self.adverse_outcome.append(retrive_ke)
                self.list_of_key_events.append((existing_ke[retrive_ke][0], existing_ke[retrive_ke][0].get_ke_numerical_id()))

        print(tmp_mie_list)
        for mie_ke in tmp_mie_list:
            print(mie_ke['event_id'])
            retrive_ke = self.get_index_of_tuple_list(0, mie_ke['event_id'], existing_ke)
            print('mie ret: ', retrive_ke)
            if retrive_ke is None:
                #there are no key events in the 'existing_ke' list that has the extracted_id's value
                #initiate new AO

                ##initate AO
                mie_identifier = 'https://identifiers.org/aop.events/' + str(mie_ke['event_id'])
                mie_label = 'KE ' + str(mie_ke['event_id'])
                mie_title = mie_ke['event']
                new_mie = key_event(mie_identifier, mie_label, mie_title, True)
                new_mie.set_mie()

                self.molecular_init_event.append(new_mie)
                self.list_of_key_events.append((new_mie, new_mie.get_ke_numerical_id()))
                #append to existing_ke list
                existing_ke.append((new_mie, new_mie.get_ke_numerical_id()))
                new_mie.test_print_all()
            else:
                print('retrieve AOP')
                #retrieved_ke is not None, but is a Key event object (don't initiate new key event)
                #append retrieved_ke to list
                self.adverse_outcome.append(retrive_ke)
                self.list_of_key_events.append((existing_ke[retrive_ke][0], existing_ke[retrive_ke][0].get_ke_numerical_id()))

        print(tmp_ke_list)
        for ke in tmp_ke_list:
            print(ke['event_id'])
            retrive_ke = self.get_index_of_tuple_list(0, ke['event_id'], existing_ke)
            print('ke ret: ', retrive_ke)
            if retrive_ke is None:
                # there are no key events in the 'existing_ke' list that has the extracted_id's value
                # initiate new AO

                ##initate AO
                ke_identifier = 'https://identifiers.org/aop.events/' + str(ke['event_id'])
                ke_label = 'KE ' + str(ke['event_id'])
                ke_title = ke['event']
                new_ke = key_event(ke_identifier, ke_label, ke_title, True)
                new_ke.set_ke()

                self.list_of_key_events.append((new_ke, new_ke.get_ke_numerical_id()))
                # append to existing_ke list
                existing_ke.append((new_ke, new_ke.get_ke_numerical_id()))
                new_ke.test_print_all()
            else:
                print('retrieve AOP')
                # retrieved_ke is not None, but is a Key event object (don't initiate new key event)
                # append retrieved_ke to list
                self.list_of_key_events.append(
                    (existing_ke[retrive_ke][0], existing_ke[retrive_ke][0].get_ke_numerical_id()))

        '''KER from API'''
        for y in self.json_dictionary['relationships']:
            print(y)
            wiki_identifier_up = 'https://identifiers.org/aop.events/' + str(y['upstream_event_id'])
            wiki_identifier_down = 'https://identifiers.org/aop.events/' + str(y['downstream_event_id'])
            print('wiki_up ', wiki_identifier_up)
            print('wiki_dwn ', wiki_identifier_down)

            index_ke_upstream = self.get_index_of_tuple_list(0, wiki_identifier_up, self.list_of_key_events)
            index_ke_downstream = self.get_index_of_tuple_list(0, wiki_identifier_down, self.list_of_key_events)

            print(index_ke_upstream)
            print(index_ke_downstream)
            if index_ke_upstream != None:
                #current KE. If index_ke_downstream != none. add the KE object as downstream ke pointer for current KE
                if index_ke_downstream != None:
                    self.list_of_key_events[index_ke_upstream][0].add_downstream(self.list_of_key_events[index_ke_downstream][0])
                    # do the reverse for downstream KE object, add upstream pointer to the current KE
                    self.list_of_key_events[index_ke_downstream][0].add_upstream(self.list_of_key_events[index_ke_upstream][0])


    # return all mie
    def get_mie(self):
        return self.molecular_init_event

    # return all ao
    def get_ao(self):
        return self.adverse_outcome

    # return all ke
    def get_all_key_events(self):
        return self.list_of_key_events

    def set_aop_identifier(self, aop_id):
        self.aop_identifier = aop_id