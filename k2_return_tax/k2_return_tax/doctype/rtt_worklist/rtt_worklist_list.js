frappe.listview_settings['RTT Worklist'] = {
    hide_name_column: true,
    hide_name_filter: true,
    onload(listview) {
        listview.page.sidebar.remove();
        hidden_create_button(listview);
    },

    refresh(listview) {
        hidden_create_button(listview);
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
        const doc_no = doc.folio.split(':')[0].trim();
        return `/app/rtt-request-form/${doc_no}?serial_number=${doc.serial_number}`;
    }
}

function hidden_create_button(listview) {
    setTimeout(() => {
        listview.page.clear_primary_action();
    }, 300);
}