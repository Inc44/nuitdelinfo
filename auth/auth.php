<?php
header("Content-Type: application/json");
$db_file = sys_get_temp_dir() . "/auth.json";
$input = json_decode(file_get_contents("php://input"), true);
$action = $input["action"] ?? "";
$username = strtolower(trim($input["username"] ?? ""));
$pattern = $input["pattern"] ?? [];
if (strlen($username) < 2 || strlen($username) > 32) {
	http_response_code(400);
	die(json_encode(["success" => false, "message" => "Identifiant invalide"]));
}
if (!preg_match('/^[a-z0-9_]+$/', $username)) {
	http_response_code(400);
	die(
		json_encode([
			"success" => false,
			"message" => "Caractères non autorisés",
		])
	);
}
if (!is_array($pattern) || count($pattern) < 7 || count($pattern) > 15) {
	http_response_code(400);
	die(json_encode(["success" => false, "message" => "Pattern invalide"]));
}
$users = file_exists($db_file)
	? json_decode(file_get_contents($db_file), true) ?? []
	: [];
if ($action === "register") {
	if (isset($users[$username])) {
		http_response_code(409);
		die(
			json_encode([
				"success" => false,
				"message" => "Cet identifiant existe déjà",
			])
		);
	}
	$users[$username] = [
		"pattern" => $pattern,
		"created" => time(),
	];
	file_put_contents($db_file, json_encode($users), LOCK_EX);
	echo json_encode([
		"success" => true,
		"message" => "Rythme enregistré ! Connectez-vous.",
	]);
	exit();
}
if ($action === "login") {
	if (!isset($users[$username])) {
		http_response_code(401);
		die(
			json_encode([
				"success" => false,
				"message" => "Identifiant inconnu",
			])
		);
	}
	$stored = $users[$username]["pattern"];
	if (count($pattern) !== count($stored)) {
		http_response_code(401);
		die(
			json_encode([
				"success" => false,
				"message" => "Nombre de taps incorrect",
			])
		);
	}
	$tolerance = 0.15;
	$match = true;
	for ($i = 0; $i < count($stored); $i++) {
		$diff = abs($pattern[$i] - $stored[$i]);
		$allowed = $stored[$i] * $tolerance;
		if ($diff > $allowed) {
			$match = false;
			break;
		}
	}
	if ($match) {
		echo json_encode([
			"success" => true,
			"message" => "Sésame, ouvre-toi !",
		]);
	} else {
		http_response_code(401);
		echo json_encode(["success" => false, "message" => "Rythme incorrect"]);
	}
	exit();
}
http_response_code(400);
echo json_encode(["success" => false, "message" => "Action inconnue"]);
?>
