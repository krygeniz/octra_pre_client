from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from typing import Optional, List
import asyncio
import cli  # Assumes cli.py is in the same directory
import json
import os

app = FastAPI()

# Serve UI static files at /ui
ui_path = os.path.join(os.path.dirname(__file__), 'UI')
app.mount("/ui", StaticFiles(directory=ui_path, html=True), name="ui")

@app.get("/")
def root():
    return RedirectResponse(url="/ui/index.html")

WALLET_JSON_PATH = os.path.join(os.path.dirname(__file__), 'wallet.json')

def read_wallet_json():
    try:
        with open(WALLET_JSON_PATH, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not read wallet.json: {e}")

def write_wallet_json(data):
    try:
        with open(WALLET_JSON_PATH, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not write wallet.json: {e}")

@app.on_event("startup")
async def startup_event():
    if not cli.ld():
        raise RuntimeError("Failed to load wallet")

@app.get("/balance")
async def get_balance():
    n, b = await cli.st()
    return {"nonce": n, "balance": b}

@app.post("/send")
async def send_tx(to: str, amount: float, msg: Optional[str] = None):
    n, b = await cli.st()
    if b is None or b < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    tx, _ = cli.mk(to, amount, n + 1, msg)
    ok, tx_hash, dt, r = await cli.snd(tx)
    if ok:
        return {"tx_hash": tx_hash, "time": dt}
    else:
        raise HTTPException(status_code=500, detail="Transaction failed: " + str(tx_hash))

@app.post("/multi_send")
async def multi_send(recipients: List[str] = Query(...), amounts: List[float] = Query(...)):
    if len(recipients) != len(amounts):
        raise HTTPException(status_code=400, detail="Recipients and amounts length mismatch")
    n, b = await cli.st()
    total = sum(amounts)
    if b is None or b < total:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    results = []
    for i, (to, amt) in enumerate(zip(recipients, amounts)):
        tx, _ = cli.mk(to, amt, n + 1 + i)
        ok, tx_hash, dt, r = await cli.snd(tx)
        results.append({"to": to, "amount": amt, "ok": ok, "tx_hash": tx_hash})
    return results

@app.post("/encrypt_balance")
async def encrypt_balance(amount: float):
    ok, result = await cli.encrypt_balance(amount)
    if ok:
        return result
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))

@app.post("/decrypt_balance")
async def decrypt_balance(amount: float):
    ok, result = await cli.decrypt_balance(amount)
    if ok:
        return result
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))

@app.post("/private_transfer")
async def private_transfer(to: str, amount: float):
    ok, result = await cli.create_private_transfer(to, amount)
    if ok:
        return result
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))

@app.get("/pending_transfers")
async def pending_transfers():
    transfers = await cli.get_pending_transfers()
    return {"pending_transfers": transfers}

@app.post("/claim_transfer")
async def claim_transfer(transfer_id: int):
    ok, result = await cli.claim_private_transfer(transfer_id)
    if ok:
        return result
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))

@app.get("/history")
async def get_history():
    try:
        await cli.gh()
        return cli.h
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not fetch history: {e}")

@app.get("/export_keys")
async def export_keys():
    return {
        "address": cli.addr,
        "public_key": cli.pub,
        "private_key": cli.priv
    }

@app.get("/wallet_config")
def get_wallet_config():
    data = read_wallet_json()
    # Mask private key
    data_masked = {k: (v if k != 'priv' else '***MASKED***') for k, v in data.items()}
    return data_masked

@app.get("/wallet_config/with_priv")
def get_wallet_config_with_priv():
    """WARNING: This endpoint exposes the private key. Use for admin/debug only."""
    return read_wallet_json()

@app.post("/wallet_config")
def update_wallet_config(priv: Optional[str] = None, addr: Optional[str] = None, rpc: Optional[str] = None):
    data = read_wallet_json()
    if priv:
        data['priv'] = priv
    if addr:
        data['addr'] = addr
    if rpc:
        data['rpc'] = rpc
    write_wallet_json(data)
    # Mask priv in response
    data_masked = {k: (v if k != 'priv' else '***MASKED***') for k, v in data.items()}
    return data_masked 
