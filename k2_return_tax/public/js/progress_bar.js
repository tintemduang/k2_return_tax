window.progress_bar = window.progress_bar || {};

progress_bar.render_progress_bar = function render_progress_from_status(frm) {
    if (!frm.doc.document_status) {
        return;
    }

    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "RTT Form Status",
            name: frm.doc.document_status
        },
        callback: function (r) {
            if (!r.message) return;

            const state_name = r.message.state;
            render_progress_bar_by_state(frm, state_name);
        }
    });
}

function render_progress_bar_by_state(frm, currentState) {

    const states = [
        { key: "Branch State", label: __("Branch") },
        { key: "Registration State", label: __("Registration") },
        { key: "Accounting State", label: __("Accounting") },
        { key: "Completed State", label: __("Completed") }
    ];

    const currentIndex = states.findIndex(s => s.key === currentState);

    if (currentIndex === -1) {
        console.warn("Unknown state:", currentState);
        return;
    }

    let html = `
        <div class="custom-progress">
            ${states.map((state, index) => {
                let cls = "pending";
                let content = index + 1;

                if (index < currentIndex) {
                    cls = "done";
                    content = "✓";
                } else if (index === currentIndex) {
                    cls = "active";
                }

                return `
                    <div class="step ${cls}">
                        <div class="circle">${content}</div>
                        <div class="label">${state.label}</div>
                    </div>
                `;
            }).join("")}
        </div>
    `;

    frm.fields_dict.workflow_state_html.$wrapper.html(html);
}