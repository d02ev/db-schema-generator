from app.utils.constants import DATATYPE_MAPPING


def simplify_type(data_type: str) -> str:
    if data_type in DATATYPE_MAPPING:
        return DATATYPE_MAPPING[data_type]
    return data_type
