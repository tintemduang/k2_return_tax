# Copyright (c) 2026, tin.t and contributors
# For license information, please see license.txt

import frappe
import requests
import json
from frappe.utils import cint
from frappe.model.document import Document
from frappe.utils.data import evaluate_filters


class RTTWorklist(Document):
	
    def db_insert(self, *args, **kwargs):
        pass

    def load_from_db(self):
        pass

    def db_update(self):
        pass

    @staticmethod
    def get_list(args):
        doctype = args.get("doctype")
        start = cint(args.get('start')) or 0
        page_length = cint(args.get('page_length')) or 20
        input_filters = args.get('filters')
        fields = args.get('fields')
        client_filters = []
        api_filters = []
        api_filter_fields = [
            'activity_name',
            'workflow_name',
            'authorization_level',
        ]

        client_filters = [item for item in input_filters if item[1] not in api_filter_fields]
        api_filters = [item for item in input_filters if item[1] in api_filter_fields]

        # handle operation 'in'
        new_items = []
        
        for item in api_filters[:]:
            if item[2] == 'in':
                new_items.append(item)
                api_filters.remove(item)
        for item in new_items:
            for value in item[3]:
                api_filters.append([item[0],item[1],'=',value])
        
        r_api_filters = [
            {
                'field': map_k2_field(item[1]),
                'operator': map_k2_operator(item[2]),
                'value': str(item[3])
            } for item in api_filters
        ]
        task_list = get_tasks(doctype = doctype, filters = r_api_filters)['task_list']
        RTTWorklist._task_count = len(task_list)

        input_order = args.get('order_by')
        if input_order:
            sorted_tasks = sort_objects(task_list,input_order)
        else:
            sorted_tasks = sorted(task_list, key=sort_by_status)

        result = [t for t in sorted_tasks if evaluate_filters(t, client_filters)]
        if fields == ['count(*) as result']:
            return [{'result':len(result)}]
        else:
            return result[start : start + page_length]

    @staticmethod
    def get_count(args):
        if RTTWorklist._task_count is None:
            task_list = RTTWorklist.get_list(args)
            RTTWorklist._task_count = len(task_list)
            return len(task_list)
        else:
            return RTTWorklist._task_count

    @staticmethod
    def get_stats(args):
        pass

@frappe.whitelist()
def get_tasks(doctype=None, **kwargs):
    #region parameters
    parameters = {
        'filters':[],
    }
    parameters.update(kwargs)
    #endregion parameters

    #region coding
    filters = parameters.get('filters')
    headers = {}
    task_list = []
    settings = frappe.get_single("RTT Application Settings")
    api_endpoint = settings.endpoint_url
    api_key = settings.k2_api_key
    k2_method = settings.get_worklist
    workflow_name_list = settings.workflow_name
    current_doctype = doctype
    username = frappe.get_doc('User', frappe.session.user).username

    headers = {
        'x-api-key': api_key,
        'Content-Type': 'application/json'
    }
    payload = json.dumps({
        'imperSonateUsername': username,
        'filters': filters
    })

    try:
        response = requests.post(api_endpoint + '/' + k2_method, headers=headers, data=payload)
        data = response.json()
    except Exception as e:
        return {'task_list' : []}

    if data and 'data' in data:
        data = data['data']

    for task in data:
        if task['workflowName'] in workflow_name_list:
            task_list.append({
                'name': task['serialNumber'],
                'workflow_display_name': task['workflowDisplayName'],
                'folio': task['folio'],
                'start_date': task['startDate'],
                'form_url': task['formURL'],
                'serial_number': task['serialNumber'],
                'task_status': task['status'],
                'activity_name': task['activityName']
            })
        
    #endregion coding

    #region result
    result = {
        'task_list' : task_list,
    }
    return result
    #endregion result

def map_k2_field(field_name):
    operator_mapping = {
        'activity_name': 'EventName',
        'workflow_name': 'ProcessName',
        'authorization_level': 'ParmAuthorizationLevel',
    }
    return operator_mapping.get(field_name, field_name)

def map_k2_operator(operator):
    operator_mapping = {
        '=': 'Equal',
        '>': 'Greater',
        '>=': 'GreaterOrEqual',
        '<': 'Less',
        '<=': 'LessOrEqual',
        'like': 'Like',
        '!=': 'NotEqual',
        'not like': 'NotLike',
    }
    return operator_mapping.get(operator, operator)

def sort_objects(objects, sort_string):
    all_property = ['start_date',
        'folio',
        'activity_name',
        'status',
        'serial_number',
        'workflow_display_name',
        'workflow_id',
        'form_url',
        'authorization_level',
    ]
    property_name, sort_order = parse_sort_string(sort_string)
    if(property_name in all_property):
        reverse = sort_order.lower() == "desc"
        return sorted(objects, key=lambda obj: obj[property_name], reverse=reverse)
    else:
        return sorted(objects, key=sort_by_status)
    
def parse_sort_string(sort_string):
    if '.' not in sort_string or '`' not in sort_string:
        return ['','']
    # Split by `.`, get the property name and sort order
    _, property_and_order = sort_string.split(".")
    property_name, sort_order = property_and_order.split(" ")
    return property_name.strip("`"), sort_order.strip()

def sort_by_status(task):
    status_order = {
        'Open': 0,
        'Available': 1,
        'Allocated': 2,
    }
    return status_order[task['task_status']]

@frappe.whitelist()
def get_worklist_for_homepage(start=0, page_length=10):
    args = {
        "doctype": "RTT Worklist",
        "start": start,
        "page_length": page_length,
        "filters": [],
        "fields": []
    }

    data = RTTWorklist.get_list(args)
    return data