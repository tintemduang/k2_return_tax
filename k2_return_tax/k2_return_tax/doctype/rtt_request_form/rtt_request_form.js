frappe.ui.form.on('RTT Request Form', {
    refresh(frm) {
        form_utils.align_button(frm, "send_request_button", "center");
        form_utils.style_button(frm, "send_request_button", "info");
    },

    onload: function(frm) {
        if (frm.is_new()) {
            frm.set_value("document_number", "RTT-YY-MM-XXXX");
            frm.set_value("document_status", "1000");
        }
        frm.set_df_property('document_number', 'read_only', 1);
        frm.set_df_property('document_status', 'read_only', 1);
    },

    send_request_button(frm) {
        let dialog = new frappe.ui.Dialog({
            title: __("Confirm Action"),
            static: true,
            fields: [
                {
                    fieldtype: "HTML",
                    fieldname: "confirm_msg",
                    options: `<div style="font-size:14px">"คุณต้องการส่งเอกสารนี้เพื่อพิจารณาอนุมัติใช่หรือไม่?"</div>`
                }
            ],
            primary_action_label: __("Confirm"),
            primary_action() {
                dialog.hide();
            },
            secondary_action_label: __("Cancel"),
            secondary_action() {
                dialog.hide();
            }
        });
        dialog.show();
    }

});