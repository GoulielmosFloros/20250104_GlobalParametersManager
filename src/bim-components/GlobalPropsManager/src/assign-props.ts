import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import { GlobalPropertiesManager } from "..";

// The component state expects a list of global property names and property set names.
// For each global property name, an input will be created to define its value.
// For each pset, an option will be created in a dropdown so the user can select
// to which pset the property will be added in the selected elements.
interface AssignPropsModalState {
  components: OBC.Components;
  onSubmit: () => void;
  names: string[];
  psets: string[];
}

const template: BUI.StatefullComponent<AssignPropsModalState> = (state) => {
  const { components, names, psets, onSubmit } = state;

  const panelSectionID = `form-${BUI.Manager.newRandomId()}`;
  const globalProps = components.get(GlobalPropertiesManager);
  // The highlighter is needed so we know the current selection made by the user.
  const highlighter = components.get(OBF.Highlighter);

  const onAdd = () => {
    const panelSection = document.getElementById(
      panelSectionID,
    ) as BUI.PanelSection;
    if (!panelSection) return;
    const formData = panelSection.value;
    for (const name of names) {
      // For each name in the component state, we take its value from the form
      const value = formData[name];
      if (value === undefined) continue;
      globalProps.assign(
        name,
        value,
        formData.pset[0], // As the pset input is a form, we must take its first value
        highlighter.selection.select, // This gives the current selection of elements in the viewer
      );
    }
    onSubmit();
  };

  return BUI.html`
    <dialog>
      <bim-panel>
        <bim-panel-section id=${panelSectionID} label="New Props Config" fixed>
	        <!-- We map the names in the state to create one text-input for each -->
	        <!-- The most important thing is the name attribute must be defined -->
          ${names.map(
            (name) => BUI.html`
              <bim-text-input name=${name} label=${name}></bim-text-input>
            `,
          )}
          <bim-dropdown name="pset" label="Property Set" vertical>
		        <!-- We also map the pset names to create a bim-option for each -->
            ${psets.map((pset) => BUI.html`<bim-option label=${pset}></bim-option>`)}
          </bim-dropdown>
          <bim-button label="Add" @click=${onAdd}></bim-button>
        </bim-panel-section>
      </bim-panel> 
    </dialog>
  `;
};

export const assignPropsModal = (state: AssignPropsModalState) => {
  const component = BUI.Component.create<
    HTMLDialogElement,
    AssignPropsModalState
  >(template, state);

  document.body.append(component[0]);

  return component;
};
