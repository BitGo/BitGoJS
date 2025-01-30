
import { Transform } from 'jscodeshift';

const transform: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Remove mocha/should imports
  root
    .find(j.ImportDeclaration)
    .filter(path => 
      path.node.source.value === 'should' ||
      path.node.source.value === 'mocha'
    )
    .remove();

  // Add node:test and node:assert imports if needed
  const hasNodeTest = root
    .find(j.ImportDeclaration)
    .filter(path => path.node.source.value === 'node:test')
    .length > 0;

  const hasNodeAssert = root
    .find(j.ImportDeclaration)
    .filter(path => path.node.source.value === 'node:assert')
    .length > 0;

  if (!hasNodeTest) {
    root
      .find(j.Program)
      .get('body', 0)
      .insertBefore(
        j.importDeclaration(
          [j.importSpecifier(j.identifier('describe'), j.identifier('describe')), 
           j.importSpecifier(j.identifier('it'), j.identifier('it'))],
          j.literal('node:test')
        )
      );
  }

  if (!hasNodeAssert) {
    root
      .find(j.Program)
      .get('body', 0)
      .insertBefore(
        j.importDeclaration(
          [j.importDefaultSpecifier(j.identifier('assert'))],
          j.literal('node:assert')
        )
      );
  }

  // Replace should assertions and their variations
  root
    .find(j.CallExpression)
    .filter(path => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) return false;
      
      // Handle x.should.be.true(), x.should.be.false()
      if (j.MemberExpression.check(callee.object) &&
          j.Identifier.check(callee.object.property) &&
          callee.object.property.name === 'be') {
        return ['true', 'false'].includes(callee.property.name);
      }

      // Handle basic should assertions
      return j.Identifier.check(callee.property) && callee.property.name === 'should';
    })
    .forEach(path => {
      const callee = path.node.callee;
      if (j.MemberExpression.check(callee.object) &&
          j.Identifier.check(callee.object.property) &&
          callee.object.property.name === 'be') {
        // Handle x.should.be.true() -> assert.strictEqual(x, true)
        // and x.should.be.false() -> assert.strictEqual(x, false)
        const originalObject = callee.object.object.object;
        const booleanValue = callee.property.name === 'true';
        j(path).replaceWith(
          j.callExpression(
            j.memberExpression(j.identifier('assert'), j.identifier('strictEqual')),
            [originalObject, j.literal(booleanValue)]
          )
        );
      } else {
        // Handle basic should assertions
        const parentObject = path.node.callee.object;
        j(path).replaceWith(
          j.callExpression(
            j.memberExpression(j.identifier('assert'), j.identifier('ok')),
            [parentObject]
          )
        );
      }
    });

  // Replace should.equal
  root
    .find(j.CallExpression)
    .filter(path => {
      const callee = path.node.callee;
      return (
        j.MemberExpression.check(callee) &&
        j.MemberExpression.check(callee.object) &&
        j.Identifier.check(callee.property) &&
        callee.property.name === 'equal'
      );
    })
    .forEach(path => {
      j(path).replaceWith(
        j.callExpression(
          j.memberExpression(j.identifier('assert'), j.identifier('strictEqual')),
          [path.node.callee.object.object, ...path.node.arguments]
        )
      );
    });

  // Replace should.deepEqual
  root
    .find(j.CallExpression)
    .filter(path => {
      const callee = path.node.callee;
      return (
        j.MemberExpression.check(callee) &&
        j.MemberExpression.check(callee.object) &&
        j.Identifier.check(callee.property) &&
        callee.property.name === 'deepEqual'
      );
    })
    .forEach(path => {
      j(path).replaceWith(
        j.callExpression(
          j.memberExpression(j.identifier('assert'), j.identifier('deepStrictEqual')),
          [path.node.callee.object.object, ...path.node.arguments]
        )
      );
    });

  // Replace should.exist
  root
    .find(j.CallExpression)
    .filter(path => {
      const callee = path.node.callee;
      return (
        j.MemberExpression.check(callee) &&
        j.MemberExpression.check(callee.object) &&
        j.Identifier.check(callee.object.property) &&
        callee.object.property.name === 'should' &&
        j.Identifier.check(callee.property) &&
        callee.property.name === 'exist'
      );
    })
    .forEach(path => {
      j(path).replaceWith(
        j.callExpression(
          j.memberExpression(j.identifier('assert'), j.identifier('ok')),
          [path.node.callee.object.object]
        )
      );
    });

  return root.toSource();
};

export default transform;
