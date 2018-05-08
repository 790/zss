import RawCraftingRecipes from './data/crafting.json';

const CraftingRecipes = RawCraftingRecipes.map(cr => {
    /*cr.components = cr.components.reduce(
        function(accumulator, currentValue) {
          return accumulator.concat(currentValue);
        },
        []
    );*/
    return cr;
});

export {CraftingRecipes};