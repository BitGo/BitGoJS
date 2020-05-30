module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  function filterCoroutines(path) {
    const args = path.value.arguments;
    if (args.length !== 1) {
      return false;
    }

    const arg = args[0];
    return arg.type === 'FunctionExpression' && arg.generator;
  }

  function replaceCoroutines(coroutine) {
    const { body, params, id = null } = coroutine.value.arguments[0];

    // build a new async function to replace the coroutine
    const asyncFn = j.functionExpression(id, params, body);
    asyncFn.async = true;

    return asyncFn;
  }

  function removeImports(bbImport) {
    const newSpecifiers = bbImport.value.specifiers.filter(({ local, imported }) => {
      return !(local.name === 'co' && imported.name === 'coroutine');
    });
    if (newSpecifiers.length) {
      bbImport.value.specifiers = newSpecifiers;
      return bbImport.value;
    }
  }

  // replace coroutines with async functions
  let didTransform = root
    .find(j.CallExpression, { callee: { name: 'co' } })
    .filter(filterCoroutines)
    .replaceWith(replaceCoroutines)
    .size();

  // replace yield expressions with await expressions
  didTransform += root
    .find(j.YieldExpression)
    .replaceWith((expr) => {
      return j.awaitExpression(
        expr.value.argument,
      );
    })
    .size();

  // remove coroutine imports and requires
  didTransform += root
    .find(j.ImportDeclaration, { source: { value: 'bluebird' } })
    .replaceWith(removeImports)
    .size();

  // remove declarations of co
  didTransform += root
    .find(j.VariableDeclaration)
    .replaceWith((path) => {
      const decls = path.value.declarations;
      const newDecls = decls.filter((decl) => decl.id.name !== 'co');
      if (newDecls.length) {
        path.value.declarations = newDecls;
        return path.value;
      }
    })
    .size();

  return didTransform ? root.toSource({ quote: 'single' }) : null;
};
module.exports.parser = 'ts';
