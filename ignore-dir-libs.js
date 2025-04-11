const suppressedErrorCodes = [2688];

module.exports = {
  create(info) {
    const { project } = info;

    const originalGetSemanticDiagnostics = project.getSemanticDiagnostics;

    project.getSemanticDiagnostics = function (file) {
      const diagnostics = originalGetSemanticDiagnostics.call(this, file);
      return diagnostics.filter(
        (diagnostic) => !suppressedErrorCodes.includes(diagnostic.code)
      );
    };

    return {};
  },
};
