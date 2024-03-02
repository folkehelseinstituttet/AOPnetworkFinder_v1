import re


class key_event:
    # constructor
    def __init__(self, identifier, label, title, from_aopwiki):
        self.identifier = identifier
        self.ke_numerical_id = 0  # 0 as default
        self.label = label
        if type(title) is dict:
            '''There is some cases where title is a dictionary that contains the KE title.
            We want to extract only the string that contains the title and not the dictionary'''
            self.title = title['value']
        else:
            self.title = title
        self.list_of_genes = []  # string
        # some KE has multiple upstream/downstream KE. (only 1 up or down not the whole stream).
        self.list_of_upstream_ke = set()  # type key_event
        self.list_of_downstream_ke = set()  # type key_event
        self.mie = False
        self.ao = False
        self.ke = False
        self.list_of_aop_ids = set()
        self.set_of_aop_url = set()

        # extract numerical id from self.identifier (only if the ke is from AOPWiki)
        if from_aopwiki == True:
            self.extract_ke_numerical_id()
        else:
            self.ke_numerical_id = identifier

        # only for qAOP
        self.activated = False

        '''Used only when modelling qAOP, bool value that indicates if the data set contains this KE'''
        self.qAOP_KE = False

    def add_upstream(self, key_evn):
        self.list_of_upstream_ke.add(key_evn)

    def add_downstream(self, key_evn):
        self.list_of_downstream_ke.add(key_evn)

    def extract_ke_numerical_id(self):

        if isinstance(self.identifier, dict):
            self.identifier = self.identifier['value']
        # use regex to extract numbers from self.identifier
        extract_id = "\\d+$"  # pattern
        extracted_id = re.findall(extract_id, self.identifier)
        if self.ke_numerical_id == 0:
            # update id
            self.ke_numerical_id = extracted_id[0]

    def add_genes(self, genes):

        if len(self.list_of_genes) == 0:
            self.list_of_genes.append(genes)
        else:
            # if the genes exist in the list, do nothing.
            if genes not in self.list_of_genes:
                self.list_of_genes.append(genes)

    def test_print_all(self):
        print('id: {}, label: {}, title: {}, type: {}'.format(self.identifier, self.label, self.title, self.ke_type()))

    def get_identifier(self):
        return self.identifier

    def get_title(self):
        return self.title

    def get_label(self):
        return self.label

    def get_ke_numerical_id(self):
        return self.ke_numerical_id

    # return all upstream ke, 1 key event level up
    def get_upstream(self):
        return self.list_of_upstream_ke

    def get_downstream(self):
        return self.list_of_downstream_ke

    def get_upstream_list(self):
        return list(self.list_of_upstream_ke)

    def get_downstream_list(self):
        return list(self.list_of_downstream_ke)

    # get number of downstream ke
    def get_nr_downstream(self):
        # use set to remove duplicates
        return len(set(self.list_of_downstream_ke))

    # get number of upstream ke
    def get_nr_upstream(self):
        # use set to remove duplicates
        return len(set(self.list_of_upstream_ke))

    # get number of genes
    def get_nr_genes(self):
        # use set to remove duplicates
        return len(set(self.list_of_genes))

    # return list of genes
    def get_list_of_genes(self):
        return set(self.list_of_genes)

    # set key event type
    def set_ao(self):
        self.ao = True

    def set_mie(self):
        self.mie = True

    def set_ke(self):
        self.ke = True

    # get key event type
    def get_ao(self) -> bool:
        return self.ao

    def get_mie(self) -> bool:
        return self.mie

    def get_ke(self) -> bool:
        return self.ke

    # Used for modelling qAOPs
    def set_qaop_ke(self):
        self.qAOP_KE = True

    def get_qaop_ke(self) -> bool:
        return self.qAOP_KE

    def print_ke_type(self) -> str:
        if self.get_ao():
            return 'Adverse Outcome'

        if self.get_mie():
            return 'Molecular Initiating Event'

        if self.get_ke():
            return 'Key Event'

        return 'None, need to declare type of key event'

    # get type of KE
    def ke_type(self) -> str:
        if self.get_ao():
            return 'AO'
        elif self.get_mie():
            return 'MIE'

        return 'KE'

    def set_aop(self, aop_id):
        self.list_of_aop_ids.add(aop_id)

    def get_aop(self):
        return list(self.list_of_aop_ids)

    def get_aop_urls(self):
        return list(self.set_of_aop_url)

    def add_aop_url(self, aop_url):
        self.set_of_aop_url.add(aop_url)
