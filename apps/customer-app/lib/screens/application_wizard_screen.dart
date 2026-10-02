import 'package:flutter/material.dart';
import 'package:customer_app/models/product.dart';
import 'package:customer_app/models/form_schema.dart';
import 'package:customer_app/services/api_service.dart';
import 'package:customer_app/widgets/dynamic_form_renderer.dart';
import 'package:customer_app/screens/my_applications_screen.dart';

class ApplicationWizardScreen extends StatefulWidget {
  final ProductModel product;

  const ApplicationWizardScreen({super.key, required this.product});

  @override
  State<ApplicationWizardScreen> createState() => _ApplicationWizardScreenState();
}

class _ApplicationWizardScreenState extends State<ApplicationWizardScreen> {
  List<FormStepSchema> _steps = [];
  int _currentStepIndex = 0;
  bool _isLoadingSchema = true;
  bool _isSavingDraft = false;
  bool _isSubmitting = false;
  String? _draftAppId;
  String? _draftAutosavedAt;
  Map<String, dynamic> _formData = {};
  bool _acceptedTerms = false;
  late String _idempotencyKey;

  @override
  void initState() {
    super.initState();
    _idempotencyKey = 'sub_idemp_${DateTime.now().millisecondsSinceEpoch}';
    _loadFormSchema();
  }

  Future<void> _loadFormSchema() async {
    try {
      final steps = await ApiService().fetchFormSchema(widget.product.id);
      if (mounted) {
        setState(() {
          _steps = steps;
          _isLoadingSchema = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingSchema = false);
    }
  }

  Future<void> _autoSaveDraft() async {
    setState(() => _isSavingDraft = true);
    try {
      final draft = await ApiService().saveDraft(
        productId: widget.product.id,
        formData: _formData,
        currentStep: _currentStepIndex + 1,
        applicationId: _draftAppId,
      );
      if (mounted) {
        setState(() {
          _draftAppId = draft.id;
          _draftAutosavedAt = 'Autosaved at ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}';
          _isSavingDraft = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isSavingDraft = false);
    }
  }

  Future<void> _submitApplication() async {
    if (!_acceptedTerms) return;
    setState(() => _isSubmitting = true);

    try {
      // Ensure draft is saved first if not created
      if (_draftAppId == null) {
        final draft = await ApiService().saveDraft(
          productId: widget.product.id,
          formData: _formData,
          currentStep: _steps.length + 1,
        );
        _draftAppId = draft.id;
      }

      final app = await ApiService().submitApplication(
        applicationId: _draftAppId!,
        submissionIdempotencyKey: _idempotencyKey,
        formData: _formData,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Application ${app.applicationNumber} submitted successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const MyApplicationsScreen()),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submission failed: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _nextStep() {
    _autoSaveDraft();
    if (_currentStepIndex < _steps.length) {
      setState(() => _currentStepIndex++);
    }
  }

  void _previousStep() {
    if (_currentStepIndex > 0) {
      setState(() => _currentStepIndex--);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingSchema) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.product.name)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final isReviewStep = _currentStepIndex == _steps.length;

    return Scaffold(
      appBar: AppBar(
        title: Text('Apply — ${widget.product.name}'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Step Header Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isReviewStep
                            ? 'Step ${_steps.length + 1} of ${_steps.length + 1}: Final Review'
                            : 'Step ${_currentStepIndex + 1} of ${_steps.length + 1}: ${_steps[_currentStepIndex].title}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      if (_draftAutosavedAt != null)
                        Text(
                          _draftAutosavedAt!,
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
                        ),
                    ],
                  ),
                ),
                if (_isSavingDraft)
                  const SizedBox(
                    height: 16,
                    width: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Main Form Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: isReviewStep ? _buildReviewStep() : _buildFormStep(_steps[_currentStepIndex]),
            ),
          ),

          // Bottom Navigation Buttons
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black.withAlpha(13), blurRadius: 4, offset: const Offset(0, -2))],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (_currentStepIndex > 0)
                  OutlinedButton(
                    onPressed: _previousStep,
                    child: const Text('Back'),
                  )
                else
                  const SizedBox(),
                if (!isReviewStep)
                  ElevatedButton(
                    onPressed: _nextStep,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Next'),
                  )
                else
                  ElevatedButton(
                    onPressed: _acceptedTerms && !_isSubmitting ? _submitApplication : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade800,
                      foregroundColor: Colors.white,
                    ),
                    child: _isSubmitting
                        ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Submit Application'),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormStep(FormStepSchema step) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (step.description != null) ...[
          Text(step.description!, style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
          const SizedBox(height: 16),
        ],
        DynamicFormRenderer(
          fields: step.fields,
          initialValues: _formData,
          applicationId: _draftAppId,
          onChanged: (updated) {
            _formData = updated;
          },
          onFileUploadRequested: (fieldKey, fileName) async {
            if (_draftAppId != null) {
              await ApiService().registerDocument(
                applicationId: _draftAppId!,
                documentType: fieldKey.toUpperCase(),
                s3Key: 'applications/$_draftAppId/$fieldKey/$fileName',
                fileName: fileName,
                fileSizeBytes: 1024000,
                mimeType: 'application/pdf',
              );
            }
          },
        ),
      ],
    );
  }

  Widget _buildReviewStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Review Application Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text('Please verify all details before submitting your financial application.', style: TextStyle(color: Colors.grey, fontSize: 13)),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Product: ${widget.product.name}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                const Divider(),
                ..._formData.entries.map((e) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(e.key, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                      Text(e.value?.toString() ?? '-', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    ],
                  ),
                )),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        CheckboxListTile(
          value: _acceptedTerms,
          onChanged: (val) => setState(() => _acceptedTerms = val ?? false),
          title: const Text('I declare that all information provided is accurate and true to the best of my knowledge.', style: TextStyle(fontSize: 12)),
          controlAffinity: ListTileControlAffinity.leading,
        ),
      ],
    );
  }
}
