module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  function changeCoroutineToAsyncFunction(coroutine) {
    const { body, params, id = null } = coroutine.value.arguments[0];

    j(body)
      .find(j.YieldExpression)
      .replaceWith((expr) => {
        return j.awaitExpression(
          expr.value.argument,
        );
      });

    // build a new async function to replace the coroutine
    const asyncFn = j.functionExpression(id, params, body);
    asyncFn.async = true;

    // recurse
    j(body)
      .find(j.CallExpression, { callee: { name: 'co' } })
      .replaceWith(changeCoroutineToAsyncFunction);

    return asyncFn;
  }

  function filterCoroutines(path) {
    const args = path.value.arguments;
    if (args.length !== 1) {
      return false;
    }

    const arg = args[0];
    return arg.type === 'FunctionExpression' && arg.generator;
  }

  const didTransform = root
    .find(j.CallExpression, { callee: { name: 'co' } })
    .filter(filterCoroutines)
    .replaceWith(changeCoroutineToAsyncFunction)
    .size();

  return didTransform ? root.toSource({ quote: 'single' }) : null;
};
module.exports.parser = 'ts';
