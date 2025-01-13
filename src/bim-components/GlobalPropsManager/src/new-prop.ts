import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import { GlobalPropertiesManager } from "..";

interface NewPropModalState {
  components: OBC.Components;
  onSubmit: () => void;
}

const template: BUI.StatefullComponent<NewPropModalState> = (state) => {
  const { components, onSubmit } = state;

  // Panel sections can work as forms as they provide an object
  // that represents the values of each of their inputs.
  // To actually take the panel section, we create a random ID for it
  // to make sure its unique along the whole app instance.
  const panelSectionID = `form-${BUI.Manager.newRandomId()}`;
  const globalProps = components.get(GlobalPropertiesManager);

  const onAdd = () => {
    const panelSection = document.getElementById(
      panelSectionID,
    ) as BUI.PanelSection;
    if (!panelSection) return;
    // We take the value from the panel section as it give us the name
    // and type defined by the user.
    // This is possible because the name attribute in both the text input and
    // the dropdown was defined in the HTML template down below.
    const { name, type } = panelSection.value;
    // As the type value is a dropdown, we must take its first entry.
    globalProps.list.add({ name, type: type[0] });
    onSubmit();
  };

  return BUI.html`
    <dialog>
      <bim-panel>
        <bim-panel-section id=${panelSectionID} label="New Global Property" fixed>
          <bim-text-input name="name" label="Name"></bim-text-input>
          <bim-dropdown name="type" label="Type">
            <bim-option label="IfcText"></bim-option> 
            <bim-option label="IfcBoolean"></bim-option> 
            <bim-option label="IfcLabel"></bim-option> 
            <bim-option label="IfcIdentifier"></bim-option> 
          </bim-dropdown>
          <bim-button label="Add" @click=${onAdd}></bim-button>
        </bim-panel-section>
      </bim-panel> 
    </dialog>
  `;
};

export const newPropModal = (state: NewPropModalState) => {
  const component = BUI.Component.create<HTMLDialogElement, NewPropModalState>(
    template,
    state,
  );

  document.body.append(component[0]);

  return component;
};
