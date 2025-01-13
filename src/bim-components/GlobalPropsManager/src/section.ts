import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import { GlobalPropertiesManager } from "..";
import { globalPropsList } from "./props-list";
import { assignPropsModal } from "./assign-props";
import { newPropModal } from "./new-prop";

interface GlobalPropsSectionState {
  components: OBC.Components;
}

const sectionTemplate: BUI.StatefullComponent<GlobalPropsSectionState> = (
  state,
) => {
  const { components } = state;

  // When the section is created, an instance of the properties list is also made.
  // We use the list.onItemAdded event to update the list anytime a new property
  // is added to the list
  const [propsList, updatePropsList] = globalPropsList({ components });
  const globalProps = components.get(GlobalPropertiesManager);
  globalProps.list.onItemAdded.add(() => updatePropsList());

  // A new props modal is created when the section is created.
  const [newProps] = newPropModal({
    components,
    onSubmit: () => newProps.close(),
  });

  // Also, an assign props modal is created with an empty set of names and psets.
  const [assignProps, updateAssignProps] = assignPropsModal({
    components,
    names: [],
    psets: [],
    onSubmit: () => assignProps.close(),
  });

  // This callback is executed when the user wants to add one or some global properties
  // to the selected elements in the scene.
  const onAdd = async () => {
    // As we activated selectable-rows in the bim-table attributes, we can
    // take the current rows selected by the user, which are the properties that
    // will be added to the selected elements.
    const selection = propsList.selection;
    // The highlighter is important because it can give us the current selection
    // made by the user.
    const highlighter = components.get(OBF.Highlighter);
    // With the indexer, we will take the list of property set names of
    // the elements selected.
    const indexer = components.get(OBC.IfcRelationsIndexer);
    // We use the FragmentsManager to convert the FragmentIdMap reported by the
    // highlighter as the user selection to a ModelIdMap.
    // We do it so the model can be taken and we can get the psets of the element.
    const fragments = components.get(OBC.FragmentsManager);
    const modelIdMap = fragments.getModelIdMap(highlighter.selection.select);
    // In case there is no selection in either the table or the viewer, we skip the execution.
    if (selection.size === 0 || Object.keys(modelIdMap).length === 0) return;
    // From the table selection, which are the global properties to be added, just
    // the name is taken.
    const props = [...selection].map(({ Name }) => Name) as string[];
    // We create an empty list of property set values, so we fill them later.
    // A set is used so only unique pset names are taken into consideration.
    const psets = new Set<string>();
    for (const [modelID, expressIDs] of Object.entries(modelIdMap)) {
      const model = fragments.groups.get(modelID);
      if (!model) continue;
      for (const expressID of expressIDs) {
        // "IsDefinedBy" is the name of the relation that gets the expressIDs of
        // IfcPropertySet for any element.
        const defs = indexer.getEntityRelations(
          model,
          expressID,
          "IsDefinedBy",
        );
        // For each property set, the name is taken.
        for (const defID of defs) {
          const defAttrs = await model.getProperties(defID);
          if (!defAttrs) continue;
          if (defAttrs.Name?.value) psets.add(defAttrs.Name.value);
        }
      }
    }
    if (psets.size === 0) return;
    propsList.selection = new Set();
    // The assign props modal is updated so it reflect the list global properties
    // selected in the table and the property set names of the selected elements
    // in the viewer.
    updateAssignProps({ names: props, psets: [...psets] });
    assignProps.showModal();
  };

  const onImport = async () => {
    // Create an input element
    const input = document.createElement("input");

    // Set the input type to file
    input.type = "file";

    // Accept only .csv files
    input.accept = ".csv";

    // Do not allow multiple file selection
    input.multiple = false;

    // Listen for the change event when a file is selected
    input.addEventListener("change", async (event) => {
      const file = (event.target as HTMLInputElement)?.files?.[0];
      if (!file) return; // Exit if no file is selected

      // Read the file as text
      const text = await file.text();

      // Process the CSV content here (parsing, validating, etc.)
      console.log("Imported CSV content:", text);
      // Add further processing logic as needed

      // Pass the extracted text content to the addFromText method of the globalProps component to process the data.
      globalProps.addFromText(text);
    });

    // Programmatically click the input to open the file picker dialog
    input.click();
  };

  return BUI.html`
    <bim-panel-section label="Global Properties" icon="mage:box-3d-fill">
      ${propsList}
      <div style="display: flex; gap: 0.25rem">
        <bim-button label="New Global Property" @click=${() => newProps.showModal()}></bim-button>
        <bim-button label="Add To Selection" @click=${onAdd}></bim-button>
        <bim-button label="Import" @click=${onImport}></bim-button>
      </div>
    </bim-panel-section>
  `;
};

export const globalPropsSection = (state: GlobalPropsSectionState) => {
  const component = BUI.Component.create<
    BUI.PanelSection,
    GlobalPropsSectionState
  >(sectionTemplate, state);

  return component;
};
