import * as OBC from "@thatopen/components";
import * as WEBIFC from "web-ifc";
import * as FRAGS from "@thatopen/fragments";

export class GlobalPropertiesManager extends OBC.Component {
  static uuid = "70cd238a-002e-415c-b63c-0d253d71a7b5" as const;
  enabled = true;

  // The list property will hold all the global properties.
  // Each global property will have the necessary information to be
  // created in the IFC file. That is, the name and data type.
  // We use the DataSet class from the components library as it
  // includes some listeners and utilities (like a guard) we can
  // use to enhance its usage. The DataSet class is just an extension
  // of the built-in Set in JavaScript.
  readonly list = new OBC.DataSet<{ name: string; type: string }>();

  constructor(components: OBC.Components) {
    super(components);
    components.add(GlobalPropertiesManager.uuid, this);
    // The guard in DataSet is a function that will run for each entry
    // we try to add to the Set. If the function returns true, the entry
    // will be added. If returns false, then it won't be added and thus
    // won't emmit any event.
    this.list.guard = ({ name }) => {
      const existing = [...this.list].find(({ name: n }) => n === name);
      return !existing;
    };
  }

  /**
   * Adds a global parameter to a list of elements in the defined pset.
   *
   * @param name - The name of the global parameter.
   * @param value - The value of the parameter to be added.
   * @param propertySet - The name of the pset where the parameter will be added.
   * @param fragmentIdMap - The selection of elements to add the parameter to.
   */
  async assign(
    name: string,
    value: string | boolean | number,
    propertySet: string,
    fragmentIdMap: FRAGS.FragmentIdMap,
  ) {
    // We must take the parameter information based on the data in list.
    // If no parameter is found, the function finishes.
    const property = [...this.list].find(({ name: n }) => n === name);
    if (!property) return;

    // The IfcRelationsIndexer is needed to take all the property sets of the element
    // and evaluate if the one passed in the arguments of the function
    // exists.
    const indexer = this.components.get(OBC.IfcRelationsIndexer);

    // The IfcPropertiesManager is needed to inform the engine a change has been
    // made to a property set because we will add a new parameter to it.
    const propsManager = this.components.get(OBC.IfcPropertiesManager);

    // To add a new property to the IFC model, the model it-self is needed.
    // The FragmentIdMap only includes the fragments and elements, not the model it-self.
    // For that reason, we use the FragmentsManager to take a ModelIdMap out of the
    // FragmentIdMap, as it includes the Model IDs and the corresponding elements.
    const fragments = this.components.get(OBC.FragmentsManager);
    const modelIdMap = fragments.getModelIdMap(fragmentIdMap);

    for (const [modelID, expressIDs] of Object.entries(modelIdMap)) {
      // We take the actual model based on the ModelIdMap.
      // If no one is found, the iteration continues to the next entry.
      const model = fragments.groups.get(modelID);
      if (!model) continue;

      // We will create one different parameter (with the same name and type) for
      // each element in the model.
      // That way, the parameter value for each element can be managed individually.
      for (const expressID of expressIDs) {
        // "IsDefinedBy" is the name of the relation that gets the expressIDs of
        // IfcPropertySet for any element.
        // We need to take the list of psets for an element to evaluate if the one
        // passed in the arguments exists.
        const definitions = indexer.getEntityRelations(
          model,
          expressID,
          "IsDefinedBy",
        );
        // An empty variable is created to represent the property set.
        let pset: Record<string, any> | null = null;
        for (const defID of definitions) {
          const defAttrs = await model.getProperties(defID);
          if (!defAttrs) continue;
          const nameMatches = defAttrs.Name?.value === propertySet;
          if (!nameMatches) continue;
          pset = defAttrs; // The pset variable is reassigned to be the pset found
          break;
        }
        if (!pset) continue;
        const { type } = property;
        // The newSingleProperty method is used to create the actual IfcPropertySingleValue
        // entity in the model.
        // @ts-ignore
        const prop = await propsManager.newSingleProperty(
          model,
          type,
          name,
          value,
        );
        // A new reference (Handle) is created based on the expressID of the new
        // property and assigned to the HasProperties attribute in the pset.
        // That is needed so the pset is aware of the new property added.
        pset.HasProperties.push(new WEBIFC.Handle(prop.expressID));
        // We inform the IfcPropertiesManager the pset has changed, meaning the
        // data will be correctly downloaded if needed.
        propsManager.setData(model, pset);
      }
    }
  }

  async addFromText(text: string, delimiter: string = ",") {
    // Split the text by '\r\n' (Windows-style newlines)
    const lines = text.split("\r\n");

    // Exclude the first line (header or irrelevant data)
    const newItems = lines
      .slice(1)
      .map((line) => {
        const parts = line.split(delimiter); // Split each line by the specified delimiter
        if (parts.length === 2) {
          return {
            name: parts[0].trim(), // Trim any leading/trailing whitespace
            type: parts[1].trim(), // Trim any leading/trailing whitespace
          };
        }
        return null; // If the line doesn't have exactly two parts, return null
      })
      .filter((item) => item !== null); // Filter out any null values (in case the line wasn't valid)

    for (const item of newItems) {
      this.list.add(item); // Add the entire object (name and type) to the DataSet
    }
  }
}

export * from "./src";
