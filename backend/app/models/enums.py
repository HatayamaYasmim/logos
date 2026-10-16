
from enum import Enum

class IncidentCategory(str, Enum):
    VEHICLE_ACCIDENT = "Acidente com Veículo"
    VICTIM_ACCIDENT = "Acidente com Vítimas"
    WEATHER = "Condição Climática Atípica na Pista"
    MECHANICAL = "Problema Mecânico"
    ROAD_BLOCK = "Bloqueio de Pista"


class IncidentSeverity(str, Enum):
    HIGH = "Alta"
    MEDIUM = "Média"
    LOW = "Baixa"


class IncidentStatus(str, Enum):
    OPEN = "Aberto"
    INVESTIGATING = "Em Investigação"
    CLOSED = "Fechado"
    INCONCLUSIVE = "Inconclusivo"
