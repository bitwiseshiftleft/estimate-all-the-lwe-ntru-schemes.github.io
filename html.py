# -*- coding: utf-8 -*-
"""
Generate readable HTML table for comparing estimates.

AUTHOR:

    Fernando Virdia - 2018

"""


from math import log, ceil
from cost_asymptotics import BKZ_COST_ASYMPTOTICS
from inspect import getsource
from string import lower
import json

JSONPATH = "docs/res/full_table.js"

def generate_costs_json():
    """ Generates a JSON string from the BKZ_COST_ASYMPTOTICS list.

    :returns:   the generated string
    """
    models = []
    for model in BKZ_COST_ASYMPTOTICS:
        models += [{
            "name": model["name"],
            "lambda": "%s"%getsource(model["reduction_cost_model"]).split('":')[1][:-2],
            "human": model["human_friendly"],
            "group": model["group"]
        }]
    return json.dumps(models)

def generate_table_json(estimates_list):
    """ Generates a JSON string from the estimates list.

    :params estimates_list:         list of estimates generated by estimates.py
    :returns:                       the generated string
    """

    def sanitise_param(scheme):
        """ Given a Sagemath object, it sanitises its entries for enabling JSON
            dumping.

        :returns:           the sanitised object
        """
        ring = False
        if "ring" in scheme["param"]:
            ring = scheme["param"]["ring"]
        # sanitise secret_distribution
        secret_distribution = False
        if "secret_distribution" in scheme["param"]:
            secret_distribution = scheme["param"]["secret_distribution"]
            if type(secret_distribution) != str:
                if type(secret_distribution[0]) == tuple:
                    a = int(secret_distribution[0][0])
                    b = int(secret_distribution[0][1])
                    h = int(secret_distribution[1])
                    secret_distribution = ((a, b), h)
                else:
                    a = int(secret_distribution[0])
                    b = int(secret_distribution[1])
                    secret_distribution = (a, b)

        if "NTRU" in scheme["scheme"]["assumption"]:
            scheme["param"] = {
                "n": int(scheme["param"]["n"]),
                "sd": float(scheme["param"]["sd"]),
                "q": int(scheme["param"]["q"]),
                "norm_f": float(scheme["param"]["norm_f"]),
                "norm_g": float(scheme["param"]["norm_g"]),
                "claimed": "" if not scheme["param"]["claimed"] else int(scheme["param"]["claimed"]),
                "category": map(int, scheme["param"]["category"]),
            }
            if secret_distribution:
                scheme["param"]["secret_distribution"] = str(secret_distribution)
        else:
            # sanitise param object
            k = None if "k" not in scheme["param"] else scheme["param"]["k"]
            scheme["param"] = {
                "n": int(scheme["param"]["n"]),
                "sd": float(scheme["param"]["sd"]),
                "q": int(scheme["param"]["q"]),
                "secret_distribution": str(secret_distribution),
                "claimed": "" if not scheme["param"]["claimed"] else int(scheme["param"]["claimed"]),
                "category": map(int, scheme["param"]["category"]),
            }
            if k:
                scheme["param"]["k"] = k

        if ring:
            scheme["param"]["ring"] = ring
        return scheme

    return json.dumps(map(sanitise_param, estimates_list))


def generate_json(estimates_list):
    """ Generates a JSON string from the estimates and asymptotics list, and add
        it to the website.

    :params estimates_list:         list of estimates generated by estimates.py
    """

    json = "var models = %s;\nvar estimates = %s;"%(
        generate_costs_json(),
        generate_table_json(estimates_list)
    )

    with open(JSONPATH, "w") as f:
        f.write(json)