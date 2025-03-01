class InfiniteScrollPagination:
    def __init__(self, data, limit, has_more, extra={}):
        self.data = data
        self.limit = limit
        self.has_more = has_more
        self.extra = extra if extra else {}
