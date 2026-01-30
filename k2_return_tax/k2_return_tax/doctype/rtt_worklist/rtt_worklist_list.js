frappe.listview_settings['RTT Worklist'] = {
    // hide_name_column: true,
    // hide_name_filter: true,
    onload(listview) {
        listview.page.sidebar.remove();
    },

    get_indicator: function (doc) {
        if(doc.task_status == "Open"){
            return [__(doc.task_status), "yellow"];
        }
        else if(doc.task_status == "Available"){
            return [__(doc.task_status), "green"];
        }
        else {
            return [__(doc.task_status), "red"];
        }
	},
    
    get_form_link(doc) {
        // console.log(doc)
        if (doc.activity_name == "Reviewer") {
            doc.form_url = "http://10.1.112.152:8000/app/document-request-approve/"
        }
        else if (doc.activity_name == "Approver") {
            doc.form_url = "http://10.1.112.152:8000/app/document-request/"
        }
        else {
            doc.form_url = "http://10.1.112.152:8000/app/document-request/"
        }
        
        let doc_id = doc.folio.split("Document Request : ")[1].split(" :")[0];
        return doc.form_url + doc_id + '?serial_number='+ doc.serial_number;
    },
}