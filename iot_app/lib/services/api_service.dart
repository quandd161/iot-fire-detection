import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants.dart';

class ApiService {
  static const Duration _timeout = Duration(seconds: 5);

  Future<Map<String, dynamic>> getData() async {
    try {
      print('🌐 API: GET ${AppConstants.baseUrl}/api/data');
      final response = await http
          .get(Uri.parse('${AppConstants.baseUrl}/api/data'))
          .timeout(_timeout);
      print('📦 API Response: ${response.statusCode}');
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load data: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ API getData error: $e');
      throw Exception('Connection error: $e');
    }
  }

  Future<List<dynamic>> getNotifications() async {
    try {
      print('🌐 API: GET ${AppConstants.baseUrl}/api/notifications');
      final response = await http
          .get(Uri.parse('${AppConstants.baseUrl}/api/notifications'))
          .timeout(_timeout);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'] ?? [];
      } else {
        return [];
      }
    } catch (e) {
      print('❌ API getNotifications error: $e');
      return [];
    }
  }

  Future<void> controlRelay1(bool state) async {
    try {
      print('🎛️ Controlling Relay1: $state');
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/control/relay1'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'state': state}),
      );
      print('📡 Relay1 response: ${response.statusCode} - ${response.body}');
      if (response.statusCode != 200) {
        print('❌ Relay1 control failed: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Relay1 control error: $e');
      rethrow;
    }
  }

  Future<void> controlRelay2(bool state) async {
    try {
      print('🎛️ Controlling Relay2: $state');
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/control/relay2'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'state': state}),
      );
      print('📡 Relay2 response: ${response.statusCode} - ${response.body}');
      if (response.statusCode != 200) {
        print('❌ Relay2 control failed: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Relay2 control error: $e');
      rethrow;
    }
  }

  Future<void> controlWindow(bool state) async {
    try {
      print('🎛️ Controlling Window: $state');
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/control/window'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'state': state}),
      );
      print('📡 Window response: ${response.statusCode} - ${response.body}');
      if (response.statusCode != 200) {
        print('❌ Window control failed: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Window control error: $e');
      rethrow;
    }
  }

  Future<void> controlBuzzer(bool state) async {
    try {
      print('🎛️ Controlling Buzzer: $state');
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/control/buzzer'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'state': state}),
      );
      print('📡 Buzzer response: ${response.statusCode} - ${response.body}');
      if (response.statusCode != 200) {
        print('❌ Buzzer control failed: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Buzzer control error: $e');
      rethrow;
    }
  }

  Future<void> setMode(String mode) async {
    try {
      print('🎛️ Setting Mode: $mode');
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/control/mode'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'mode': mode}),
      );
      print('📡 Mode response: ${response.statusCode} - ${response.body}');
      if (response.statusCode != 200) {
        print('❌ Mode control failed: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Mode control error: $e');
      rethrow;
    }
  }

  Future<void> setThreshold(int threshold) async {
    try {
      print('🎛️ Setting Threshold: $threshold');
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/control/threshold'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'threshold': threshold}),
      );
      print('📡 Threshold response: ${response.statusCode} - ${response.body}');
      if (response.statusCode != 200) {
        print('❌ Threshold control failed: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Threshold control error: $e');
      rethrow;
    }
  }

  Future<void> registerFcmToken(String token) async {
    try {
      await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/fcm/token'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'token': token}),
      );
    } catch (e) {
      print('Error registering FCM token: $e');
    }
  }
}
