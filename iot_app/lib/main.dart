import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'providers/sensor_provider.dart';
import 'screens/dashboard_screen.dart';

import 'package:firebase_core/firebase_core.dart';
import 'services/fcm_service.dart';

import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    // Initialize FCM
    final fcmService = FcmService();
    await fcmService.init();
  } catch (e) {
    print('Firebase initialization failed: $e');
  }
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => SensorProvider()),
      ],
      child: MaterialApp(
        title: 'Gas Detection System',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF10B981),
            primary: const Color(0xFF10B981),
            secondary: const Color(0xFF3B82F6),
            error: const Color(0xFFEF4444),
            surface: const Color(0xFFF8FAFC),
          ),
          useMaterial3: true,
          textTheme: GoogleFonts.interTextTheme(),
          scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        ),
        home: const DashboardScreen(),
      ),
    );
  }
}
