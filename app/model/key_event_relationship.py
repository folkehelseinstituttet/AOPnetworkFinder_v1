# Currently not in use, may be used in the future
class key_event_relationship:

    def __init__(self, identifier, label):
        self.identifier = identifier
        self.label = label

        self.upstream_key_event = None
        self.downstream_key_event = None

        self.list_of_genes = []
