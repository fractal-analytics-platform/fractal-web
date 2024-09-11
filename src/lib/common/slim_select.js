import SlimSelect from 'slim-select';

/**
 * Initializes slim-select dropdown on a given HTML element.
 * @param {string} id id of HTML element where slim-select has to be configured
 * @param {Array<{ name: string, id: number|string }>} values
 * @param {(value: string) => void} setter function executed when a dropdown value is selected
 * @param {boolean} showSearch
 * @param {string} placeholderLabel
 * @returns the SlimSelect instance
 */
export function setSlimSelect(id, values, setter, showSearch = true, placeholderLabel = 'All') {
	if (!values) {
		return;
	}
	const selectElement = document.getElementById(id);
	if (!selectElement) {
		return;
	}
	selectElement.classList.remove('invisible');
	const select = new SlimSelect({
		select: `#${id}`,
		settings: {
			showSearch,
			allowDeselect: true
		},
		events: {
			afterChange: (selection) => {
				const selectedOption = selection[0];
				if (!selectedOption || selectedOption.placeholder) {
					setter('');
				} else {
					setter(selectedOption.value);
				}
			}
		}
	});
	setSlimSelectOptions(select, values, placeholderLabel);
	return select;
}

/**
 * Updates SlimSelect options. This rebuilds the HTML elements and unset the selected value.
 * @param {SlimSelect|undefined} select
 * @param {Array<{ name: string, id: number|string }>} values
 * @param {string} placeholderLabel
 */
export function setSlimSelectOptions(select, values, placeholderLabel = 'All') {
	if (!select) {
		return;
	}
	const options = values.map((p) => ({ text: p.name, value: p.id.toString() }));
	select.setData([{ text: placeholderLabel, placeholder: true }, ...options]);
}
