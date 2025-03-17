/**
 * jscodeshift compatible transform to convert legacy bluebird coroutines/yield syntax
 * into equivalent async/await syntax.
 *
 * Currently handled cases:
 * * coroutine assignments to const vars
 * * coroutine assignments to member expressions
 * * yield keywords in coroutine bodies
 * * redundant imports of `coroutine` from bluebird
 * * Bluebird.delay() to native Promise with setTimeout
 * * import * as Promise from 'bluebird'
 *
 * Opportunities for improvement:
 * * co() IIFE's inside class members
 */
module.exports = function (fileInfo, api) {
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

  function filterConstVarAsyncFunctions(path) {
    if (path.value.declarations.length !== 1) {
      return false;
    }
    const [decl] = path.value.declarations;

    if (decl.init === null) {
      return false;
    }

    // only async functions
    if (decl.init.type !== 'FunctionExpression' || !decl.init.async) {
      return false;
    }
    if (!decl.init.id) {
      return true;
    }
    // check for co prefix on initializer function, or no name at all
    return decl.init.id.name.toLowerCase() === `co${decl.id.name}`.toLowerCase();
  }

  function replaceConstVarAsyncFunctions(varDecl) {
    // variable declaration identifier becomes async function identifier
    const asyncFnName = varDecl.value.declarations[0].id.name;
    const { body, params } = varDecl.value.declarations[0].init;

    const replacementFn = j.functionDeclaration(j.identifier(asyncFnName), params, body);
    replacementFn.async = true;
    replacementFn.comments = varDecl.value.comments;

    return replacementFn;
  }

  function filterMemberAssignments(path) {
    const { left, right } = path.value;
    // assignment lhs must be a member expression
    if (left.type !== 'MemberExpression') {
      return false;
    }
    // assignment rhs must be a named async function expression
    if (right.type !== 'FunctionExpression' || !right.async || !right.id) {
      return false;
    }

    // rhs function name must be `coSomeFn` if lhs member name is `someFn`
    return `co${left.property.name.toLowerCase()}` === right.id.name.toLowerCase();
  }

  function replaceMemberAssignments(assignment) {
    const { right } = assignment.value;
    const replacementFn = j.functionDeclaration(null, right.params, right.body);
    replacementFn.async = true;
    replacementFn.comments = right.comments;

    return {
      ...assignment.value,
      right: replacementFn,
    };
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

  function filterBluebirdDelay(path) {
    // Check if it's a call to Bluebird.delay
    if (path.value.callee.type !== 'MemberExpression') {
      return false;
    }

    const { object, property } = path.value.callee;
    return (object.name === 'Bluebird' || object.name === 'Promise') && property.name === 'delay';
  }

  function replaceBluebirdDelay(path) {
    // Get the delay time argument
    const delayTime = path.value.arguments[0];

    // Create a new Promise with setTimeout
    return j.newExpression(j.identifier('Promise'), [
      j.arrowFunctionExpression(
        [j.identifier('resolve')],
        j.callExpression(j.identifier('setTimeout'), [j.identifier('resolve'), delayTime])
      ),
    ]);
  }

  // replace coroutines with async functions
  let didTransform = root
    .find(j.CallExpression, { callee: { name: 'co' } })
    .filter(filterCoroutines)
    .replaceWith(replaceCoroutines)
    .size();

  // replace appearances of `const someFn = async function(...) {` with `async function someFn(...) {`
  didTransform += root
    .find(j.VariableDeclaration)
    .filter(filterConstVarAsyncFunctions)
    .replaceWith(replaceConstVarAsyncFunctions)
    .size();

  // replace appearances of `someObj.someFn = async function coSomeFn(...)` with `someObj.someFn = async function(...) {`
  didTransform += root
    .find(j.AssignmentExpression)
    .filter(filterMemberAssignments)
    .replaceWith(replaceMemberAssignments)
    .size();

  // replace yield expressions with await expressions
  didTransform += root
    .find(j.YieldExpression)
    .replaceWith((expr) => {
      return j.awaitExpression(expr.value.argument);
    })
    .size();

  // replace Bluebird.delay() with native Promise + setTimeout
  didTransform += root.find(j.CallExpression).filter(filterBluebirdDelay).replaceWith(replaceBluebirdDelay).size();

  // remove coroutine imports and requires
  didTransform += root
    .find(j.ImportDeclaration, { source: { value: 'bluebird' } })
    .replaceWith(removeImports)
    .size();

  // remove namespace imports from bluebird (import * as Promise from 'bluebird')
  didTransform += root
    .find(j.ImportDeclaration, { source: { value: 'bluebird' } })
    .filter((path) => {
      return path.value.specifiers.some((specifier) => specifier.type === 'ImportNamespaceSpecifier');
    })
    .remove()
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
