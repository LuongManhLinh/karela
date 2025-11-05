from enum import Enum


class Types(Enum):
    A = "A"
    B = "B"
    UNDEFINED = "UNDEFINED"

    @classmethod
    def _missing_(cls, value):
        # called when value isn't found among members
        return cls.UNDEFINED


print(Types("A"))  # Types.A
print(Types("XYZ"))  # Types.UNDEFINED ✅
