# 将此脚本挂为 Autoload，或抽取其中的 HTTP 请求模式到现有网络层。
extends Node
const API := "http://127.0.0.1:3100/api/rpg"

func request_mint(wallet: String, item: Dictionary) -> Dictionary:
	return await _request("/requests", HTTPClient.METHOD_POST, {"kind":"mint", "wallet":wallet, "item":item})

func request_transfer(wallet: String, token_id: String, to_wallet: String) -> Dictionary:
	return await _request("/requests", HTTPClient.METHOD_POST, {"kind":"transfer", "wallet":wallet, "token_id":token_id, "to_wallet":to_wallet})

func get_assets(wallet: String) -> Array:
	var response = await _request("/assets/" + wallet.uri_encode())
	return response if response is Array else []

func _request(path: String, method := HTTPClient.METHOD_GET, body: Dictionary = {}):
	var http := HTTPRequest.new()
	add_child(http)
	var err := http.request(API + path, PackedStringArray(["Content-Type: application/json"]), method, JSON.stringify(body) if method != HTTPClient.METHOD_GET else "")
	if err != OK:
		http.queue_free()
		return {"error":"RPG chain service unavailable"}
	var result = await http.request_completed
	http.queue_free()
	return JSON.parse_string(result[3].get_string_from_utf8())
