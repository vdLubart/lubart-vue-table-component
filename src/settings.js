const settings = {
    tableClass: '',
    theadClass: '',
    tbodyClass: '',
    headerClass: '',
    cellClass: 'align-middle',
    filterInputClass: '',
    filterPlaceholder: 'Filter table…',
    filterNoResults: 'There are no matching rows',
    loadingResults: 'Loading data…'
};

export function mergeSettings(newSettings) {
    for(const setting in newSettings) {
        settings[setting] = newSettings[setting];
    }
}

export default settings;
