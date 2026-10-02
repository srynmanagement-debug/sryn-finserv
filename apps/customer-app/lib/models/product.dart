class ProductModel {
  final String id;
  final String code;
  final String name;
  final String? categoryId;
  final String? categoryName;
  final String status;
  final int version;
  final String? description;
  final String? iconUrl;
  final List<String> eligibilityRules;
  final List<String> documentRequirements;

  ProductModel({
    required this.id,
    required this.code,
    required this.name,
    this.categoryId,
    this.categoryName,
    required this.status,
    required this.version,
    this.description,
    this.iconUrl,
    this.eligibilityRules = const [],
    this.documentRequirements = const [],
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      categoryId: json['categoryId'],
      categoryName: json['categoryName'],
      status: json['status'] ?? 'DRAFT',
      version: json['version'] ?? 1,
      description: json['description'],
      iconUrl: json['iconUrl'],
      eligibilityRules: List<String>.from(json['eligibilityRules'] ?? []),
      documentRequirements: List<String>.from(json['documentRequirements'] ?? []),
    );
  }
}
