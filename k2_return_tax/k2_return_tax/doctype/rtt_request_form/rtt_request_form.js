frappe.ui.form.on('RTT Request Form', {
    refresh(frm) {
        form_utils.align_button(frm, "send_request_button", "center");
        form_utils.style_button(frm, "send_request_button", "info");
        form_utils.align_button(frm, "attachment_info_button", "right");
        progress_bar.render_progress_bar(frm);
        validate_add_attachments(frm);
    },

    onload: function(frm) {
        set_form_header(frm);
        set_document_defaults(frm);
        set_readonly_fields(frm);
        set_description_field(frm);
    },

    async send_request_button(frm) {
        try {
            await frm.save();
        } catch (e) {
            return;
        }

        let dialog = new frappe.ui.Dialog({
            title: __("Confirm Action"),
            static: true,
            fields: [
                {
                    fieldtype: "HTML",
                    fieldname: "confirm_msg",
                    options: `<div style="font-size:14px;">
                        ${__('Confirm to send the document for approval?')}
                    </div>`
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

