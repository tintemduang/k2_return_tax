frappe.ui.form.on('RTT Request Form', {
    refresh(frm) {
        form_utils.style_button(frm, "application_manual_button", "info");
        form_utils.align_button(frm, "application_manual_button", "right");
        progress_bar.render_progress_bar(frm);
        validate_add_attachments(frm);
        set_hide_add_remove_buttons(frm, 'action_history_table');
        set_hide_selected_option(frm, 'action_history_table');
        set_hide_section(frm);
        get_document_description(frm);
        k2_get_task(frm);
        set_send_request_button(frm);
    },

    onload: function(frm) {
        set_form_header(frm);
        set_document_defaults(frm);
        set_readonly_fields(frm);
        set_description_field(frm);
    },

    after_save: function(frm) {
        if (!frm.__action_history_created) {
            frm.__action_history_created = true;
            create_action_history(frm, "Create Document", "Document created successfully." ).then(() => {
                window.location.reload();
            });
        }
    },

    application_manual_button: function(frm) {
        window.open('https://frappe.io/framework', '_blank');
    }
});

function set_form_header(frm) {
    frm.set_df_property(
        'form_header_html',
        'options',
        `
        <div class="doc-header">
            ${__('RTT Request Form')}
        </div>
        `
    );
}

function set_document_defaults(frm) {
    if (frm.is_new()) {
        frm.set_value('document_number', 'RTT-YY-MM-XXXX');
        frm.set_value('document_status', '1000');
        frm.set_value('employee_name', frappe.session.user_fullname);

        get_user(function(user) {
            frm.set_value('employee_code', user.username);
        });
    }
    else {
        frm.set_value('document_number', frm.doc.name);
    }
}

function set_readonly_fields(frm) {
    frm.set_df_property('document_number', 'read_only', 1);
    frm.set_df_property('document_status', 'read_only', 1);
    frm.set_df_property('action_history_table', 'read_only', 1);
}

function set_description_field(frm) {
    frm.set_df_property(
        'branch',
        'description',
        `<b style="color:red; font-weight:bold;">
            ${__('*If branch name is incorrect or missing.. Please notify IT.')}
        </b>`
    );
}

function get_user(callback) {
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "User",
            name: frappe.session.user,
            fields: ["username"]
        },
        callback: function (r) {
            if (r.message) {
                callback(r.message);
            }
        }
    });
}

function validate_add_attachments(frm) {
    const grid = frm.fields_dict['attachment_table'].grid;

    if (grid._add_row_logged) return;
    grid._add_row_logged = true;

    const original = grid.add_new_row.bind(grid);

    grid.add_new_row = function () {

        if (frm.is_new()) {
            return frappe.show_alert({
                message: __('Please save the document before adding attachments.'),
                indicator: 'red'
            });
        }

        original();

        const rows = grid.grid_rows;
        const last_row = rows[rows.length - 1];

        if (last_row) {
            last_row.toggle_view(true);
        }
    };
}

function set_hide_add_remove_buttons(frm, child_table_fieldname) {
    if (!frm.fields_dict[child_table_fieldname]) return;
    const grid = frm.fields_dict[child_table_fieldname].grid;
    $(grid.wrapper).find('.grid-add-row').hide();
    $(grid.wrapper).find('.grid-remove-rows').hide();
};

function set_hide_selected_option(frm, child_table_fieldname) {
    const grid = frm.fields_dict[child_table_fieldname].$wrapper;
    grid.find(".row-check, .grid-check-all").remove();
}

function set_hide_section(frm) {
    if (frm.is_new()) {
        frm.set_df_property('action_history_table', 'hidden', 1);
    }
}

function get_document_description(frm) {
    frappe.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "RTT Form Status",
            filters: {
                name: frm.doc.document_status
            },
            fieldname: "description"
        },
        callback: function (r) {
            if (r.message) {
                frm.set_value('document_status_description', r.message.description);
            }
        }
    });
}

function k2_get_task(frm) {
    let serial_number = frappe.route_options.serial_number;
    frappe.route_options = {};
    if (serial_number) {
        console.log("serial_number: ", serial_number);
        frappe.call({
            doc: frm.doc,
            method: "get_task",
            args: {
                serial_number: serial_number
            },
            freeze: true,
            freeze_message: __("Getting Task..."),
            callback: function (response) {
                const actions = response.message?.actions || [];
                set_action_button(frm, actions, serial_number);
            }
        });
    }
}

function set_action_button(frm, actions, serial_number) {
    if (!actions || actions.length === 0) return;

    actions.forEach(action => {
        let btn = frm.add_custom_button(action.name, function () {
            action_workflow(frm, action.name, serial_number);
        });

        btn.removeClass("btn-default");
        
        if (action.name === "Approve") {
            btn.addClass("btn-success");
        } else if (action.name === "Reject") {
            btn.addClass("btn-danger");
        }
    });
}

function action_workflow(frm, action, serial_number) {
    frappe.call({
        doc: frm.doc,
        method: "action_workflow",
        args: {
            action: action,
            serial_number: serial_number
        },
        freeze: true,
        freeze_message: __("Progressing Document..."),
        callback: function (response) {
            console.log("response: ", response)
            // if (response) {
            //     window.location.reload();
            // }
        }
    });
}

function set_send_request_button(frm) {
    if(!frm.is_new())
    frm.add_custom_button(__('Send Request'), function () {
        action_dialog(frm, "Send Request");
    });
}

function create_action_history(frm, action, remark) {
    return frappe.call({
        doc: frm.doc,
        method: "create_action_history",
        args: {
            action: action,
            remark: remark
        },
        callback: function (r) {
            if (!r.exc) {
                frappe.show_alert({message: __('Action history created'), indicator: 'green'});
                frm.reload_doc();
            }
        }
    });
}

function action_dialog(frm, action) {
    let dialog = new frappe.ui.Dialog({
            title: __("Confirm Action"),
            static: true,
            fields: [
                {
                    fieldtype: "Data",
                    fieldname: "username",
                    label: "Username",
                    default: frm.doc.employee_name,
                },
                {
                    fieldtype: "Link",
                    options: "RTT Action",
                    fieldname: "action",
                    label: "Action",
                    reqd: 1,
                    default: action,
                },
                {
                    fieldtype: "Small Text",
                    fieldname: "remark",
                    label: "Remark",
                    reqd: 0,
                }
            ],
            primary_action_label: __("Confirm"),
            primary_action() {
                let workflow_action;
                if (dialog.get_value("action") === "Send Request") {
                    workflow_action = "submit_workflow";
                }
                else {
                    workflow_action = "action_workflow";
                }

                dialog.hide();
                frappe.call({
                    doc: frm.doc,
                    method: workflow_action,
                    freeze: true,
                    freeze_message: __("Submitting Document..."),
                    callback: function (response) {
                        console.log("response: ", response)
                        create_action_history(frm, dialog.get_value("action"), dialog.get_value("remark"));
                    }
                });
            },
            secondary_action_label: __("Cancel"),
            secondary_action() {
                dialog.hide();
            }
        });
        dialog.show();
}