import settings from "../settings";

export default {
    functional: true,

    props: ['column', 'row'],

    render(createElement, { props }) {
        const data = {};

        data.class = "table-component__td";

        if (props.column.cellClass) {
            data.class += " " + props.column.cellClass;
        }

        if(settings.cellClass){
            data.class += " " + settings.cellClass;
        }

        var cellLabel = createElement('h6', props.column.label);

        if (props.column.template) {
            var cellData = props.column.template(props.row.data);
            if(cellData !== undefined) {
                cellData.unshift(createElement('h6', props.column.label + ":"));
            }

            return createElement('div', data, cellData);
        }

        data.domProps = {};

        return createElement('div', data, [ createElement('h6', props.column.label+":"), createElement('span', props.column.formatter(props.row.getValue(props.column.show), props.row.data)) ]);
    }
};
