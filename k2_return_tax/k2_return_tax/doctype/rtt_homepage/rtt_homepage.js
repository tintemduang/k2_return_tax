frappe.dom.set_style(`
    .custom-blue-btn {
        background-color: #0d6efd !important;
        color: #fff !important;
        border: none !important;
    }

    .custom-blue-btn:hover {
        opacity: 0.9;
    }
`);

frappe.ui.form.on("RTT Homepage", {
	refresh(frm) {
        frm.page.set_title("Return Tax - Homepage");
        frm.disable_save();
        frm.current_page = 0;

        build_homepage_layout(frm);
        load_k2_summary(frm);
        load_k2_worklist(frm);
        load_action_buttons(frm);
        load_rtt_request_table(frm);
	},
});

function build_homepage_layout(frm) {

    frm.fields_dict.homepage_html.$wrapper.html(`
        <div class="k2-summary"></div>
        <div class="k2-worklist"></div>
        <div class="k2-action-buttons"></div>
        <div class="rtt-history"></div>
    `);
}

function load_k2_summary(frm) {
    frappe.call({
        method: "k2_return_tax.k2_return_tax.doctype.rtt_worklist.rtt_worklist.get_worklist_summary",
        callback: function (r) {

            let data = r.message || {
                total: 0,
                today: 0,
                read: 0,
                unread: 0
            };

            let html = `
                <div class="card" style="padding:15px; margin-bottom:15px;">
                    <div style="display:flex; gap:15px; flex-wrap:wrap;">
                        
                        ${build_summary_card("Total Tasks", data.total)}
                        ${build_summary_card("Today Tasks", data.today)}
                        ${build_summary_card("Read Tasks", data.read)}
                        ${build_summary_card("Unread Tasks", data.unread)}

                    </div>
                </div>
            `;

            if (!frm.fields_dict.homepage_html.$wrapper.find(".k2-summary").length) {
                frm.fields_dict.homepage_html.$wrapper(
                    `<div class="k2-summary"></div>`
                );
            }

            frm.fields_dict.homepage_html.$wrapper
                .find(".k2-summary")
                .html(html);
        }
    });
}

function build_summary_card(title, value) {
    return `
        <div style="
            flex:1;
            min-width:200px;
            background:#f8f9fa;
            border-radius:8px;
            padding:20px;
            text-align:center;
            box-shadow:0 2px 5px rgba(0,0,0,0.05);
        ">
            <div style="font-weight:600; font-size:14px;">
                ${title}
            </div>
            <div style="margin-top:10px; font-size:28px; font-weight:bold;">
                ${value}
            </div>
        </div>
        <br>
    `;
}

function load_k2_worklist(frm) {
    if (!frm.k2_page) {
        frm.k2_page = 0;
    }

    let page_length = 5;

    frappe.call({
        method: "k2_return_tax.k2_return_tax.doctype.rtt_worklist.rtt_worklist.get_worklist_for_homepage",
        args: {
            start: frm.k2_page * page_length,
            page_length: page_length
        },
        callback: function(r) {

            let html = `
                <div class="card" style="padding:15px; margin-bottom:3px;">
                    <h4>📌 ${__("My Worklist")}</h4>
                    <hr>

                    <table class="table table-bordered table-hover">
                        <thead>
                            <tr>
                                <th>${__("Folio")}</th>
                                <th>${__("Workflow")}</th>
                                <th>${__("Activity")}</th>
                                <th>${__("Status")}</th>
                                <th>${__("Start Date")}</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            if (!r.message || r.message.length === 0) {
                html += `
                    <tr>
                        <td colspan="5" class="text-center">
                            ${__("No tasks found")}
                        </td>
                    </tr>
                `;
            } else {
                r.message.forEach(row => {

                    let doc_no = row.folio
                        ? row.folio.split(":")[0].trim()
                        : "";

                    let link = `/app/rtt-request-form/${doc_no}?serial_number=${row.serial_number || ""}`;

                    let formatted_date = row.start_date
                        ? frappe.datetime.obj_to_user(
                            frappe.datetime.str_to_obj(row.start_date)
                          )
                        : "";

                    html += `
                        <tr>
                            <td><a href="${link}" target="_blank">${row.folio}</a></td>
                            <td>${row.workflow_display_name}</td>
                            <td>${row.activity_name}</td>
                            <td>${row.task_status}</td>
                            <td>${formatted_date}</td>
                        </tr>
                    `;
                });
            }

            html += `
                        </tbody>
                    </table>

                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
                        <button class="btn btn-xs btn-default k2-prev"
                            ${frm.k2_page === 0 ? "disabled" : ""}>
                            ${__("Previous")}
                        </button>

                        <button class="btn btn-xs btn-default k2-next"
                            ${(r.message && r.message.length < page_length) ? "disabled" : ""}>
                            ${__("Next")}
                        </button>
                    </div>
                </div><br>
            `;

            // ถ้ายังไม่มี container
            if (!frm.fields_dict.homepage_html.$wrapper.find(".k2-worklist").length) {
                frm.fields_dict.homepage_html.$wrapper(
                    `<div class="k2-worklist"></div>`
                );
            }

            // update เฉพาะส่วนนี้
            frm.fields_dict.homepage_html.$wrapper
                .find(".k2-worklist")
                .html(html);

            // bind event
            frm.fields_dict.homepage_html.$wrapper
                .find(".k2-prev")
                .on("click", function () {
                    if (frm.k2_page > 0) {
                        frm.k2_page--;
                        load_k2_worklist(frm);
                    }
                });

            frm.fields_dict.homepage_html.$wrapper
                .find(".k2-next")
                .on("click", function () {
                    if (r.message && r.message.length === page_length) {
                        frm.k2_page++;
                        load_k2_worklist(frm);
                    }
                });
        }
    });
}

function load_action_buttons(frm) {
    let html = `
        <div class="card" style="padding:20px; margin-bottom:15px;">
            <div style="
                display:flex;
                gap:15px;
                flex-wrap:wrap;
            ">

                ${build_action_button(
                    __("Create New Document"),
                    "btn-primary",
                    "bi-plus-circle",
                    "/app/rtt-request-form/new"
                )}

                ${build_action_button(
                    __("View All Created Documents"),
                    "btn-dark",
                    "bi-folder",
                    "/app/rtt-request-form"
                )}

                ${build_action_button(
                    __("View Document Submission History"),
                    "btn-dark",
                    "bi-send",
                    "#"
                )}

                ${build_action_button(
                    __("View Document Approval History"),
                    "btn-dark",
                    "bi-check-circle",
                    "#"
                )}

            </div>
        </div>
    `;

    frm.fields_dict.homepage_html.$wrapper
        .find(".k2-action-buttons")
        .html(html);
}

function build_action_button(title, type, icon, link) {

    let btn_class = type === "btn-primary"
        ? "custom-blue-btn"
        : type;

    return `
        <a href="${link}" 
           class="btn ${btn_class}"
           style="
                flex:1;
                min-width:220px;
                padding:14px;
                border-radius:12px;
                font-weight:600;
                text-align:center;
                box-shadow:0 4px 10px rgba(0,0,0,0.08);
                transition:all 0.2s ease;
           "
        >
            ${title}
        </a>
    `;
}

function load_rtt_request_table(frm) {
    if (!frm.current_page) {
        frm.current_page = 0;
    }

    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "RTT Request Form",
            fields: [
                "name",
                "employee_name",
                "branch",
                "plate_number",
                "creation"
            ],
            filters: {
                owner: frappe.session.user
            },
            limit_page_length: 5,
            limit_start: frm.current_page * 5,
            order_by: "creation desc"
        },
        callback: function(r) {

            let html = `
                <div class="card" style="padding:15px; margin-bottom:3px;">
                    <h4 style="margin:0;">📄 ${__("Document History")}</h4>
                    <hr style="margin:8px 0;">

                    <table class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>Document No</th>
                                <th>Employee Name</th>
                                <th>Branch</th>
                                <th>Plate Number</th>
                                <th>Creation</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            if (!r.message || r.message.length === 0) {
                html += `
                    <tr>
                        <td colspan="5" class="text-center">
                            No data found
                        </td>
                    </tr>
                `;
            } else {
                r.message.forEach(row => {
                    html += `
                        <tr>
                            <td>
                                <a href="/app/rtt-request-form/${row.name}">
                                    ${row.name}
                                </a>
                            </td>
                            <td>${row.employee_name || ""}</td>
                            <td>${row.branch || ""}</td>
                            <td>${row.plate_number || ""}</td>
                            <td>${frappe.datetime.str_to_user(row.creation)}</td>
                        </tr>
                    `;
                });
            }

            html += `
                        </tbody>
                    </table>

                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
                        <button class="btn btn-xs btn-default prev-page"
                            ${frm.current_page === 0 ? "disabled" : ""}>
                            Previous
                        </button>

                        <button class="btn btn-xs btn-default next-page"
                            ${(r.message && r.message.length < 5) ? "disabled" : ""}>
                            Next
                        </button>
                    </div>
                </div>
            `;

            // ✅ ถ้ายังไม่มี container ให้สร้าง
            if (!frm.fields_dict.homepage_html.$wrapper.find(".rtt-history").length) {
                frm.fields_dict.homepage_html.$wrapper.append(
                    `<div class="rtt-history"></div>`
                );
            }

            // ✅ update เฉพาะ section นี้
            frm.fields_dict.homepage_html.$wrapper
                .find(".rtt-history")
                .html(html);

            // bind event
            frm.fields_dict.homepage_html.$wrapper
                .find(".prev-page")
                .on("click", function () {
                    if (frm.current_page > 0) {
                        frm.current_page--;
                        load_rtt_request_table(frm);
                    }
                });

            frm.fields_dict.homepage_html.$wrapper
                .find(".next-page")
                .on("click", function () {
                    if (r.message && r.message.length === 5) {
                        frm.current_page++;
                        load_rtt_request_table(frm);
                    }
                });
        }
    });
}